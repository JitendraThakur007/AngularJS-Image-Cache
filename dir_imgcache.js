var LOG_TAG = 'DIR_IMGCACHE: ';
var FOLDER_IMAGE_CACHE = 'IMAGE_CACHE';
var LastUsedMap = null;
var hasRunClearup = false;

app.directive('cacheimg', function() {
    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {
            console.log(LOG_TAG + 'Starting Directive.');
            
            // Run a clear up initialy if we haven't already
            if (!hasRunClearup){
                hasRunClearup = true;
                clearUnusedCache();
            }
            
            // Watch any value changes
            scope.$watch(function () {
                return elem.css(attrs.style);
            },  function(){

                // Style has been changed so check image hasn't been modified
                findImageURLs(elem, attrs);

            }, true);

            scope.$watch(function () {
                return attrs.src;
            },  function(){

                // Image source has been changed so check image hasn't been modified
                findImageURLs(elem, attrs);

            }, true);


            // Do an initial search for anything pre-set
            findImageURLs(elem, attrs);

        }
    };
});

function findImageURLs(elem, attrs){
    // Check for  background image
    if (elem.css('background-image') !== 'none'){
        console.log(LOG_TAG + 'Background Image');

        var backimgsrc = elem.css('background-image');
        if (backimgsrc.startsWith('url(')){
            backimgsrc = backimgsrc.substring(4, backimgsrc.length -1);
        }

        // Retrieve from the cache (or download if we havent already)
        GetFromCache(backimgsrc, function(imgPath){
            console.log(LOG_TAG + 'Got image - setting now');

            // Got the image, set it now
            elem.css('background-image', 'url(' + imgPath + ')');

        }, function(err){
            console.log(LOG_TAG + 'Failed to get image from cache');

            // SET BROKEN LINK IMAGE HERE
            elem.css('background-image', 'url(../../img/brokenlink.png)');

        });

    }

    // Check for a src tag
    if (attrs.src !== undefined){
        console.log(LOG_TAG + 'Found Src Tag');

        // Retrieve from the cache (or download if we havent already)
        GetFromCache(attrs.src, function(imgPath){
            console.log(LOG_TAG + 'Got image - setting now');

            // Got the image, set it now
            attrs.$set('src', imgPath);

        }, function(err){
            console.log(LOG_TAG + 'Failed to get image from cache');

            // SET BROKEN LINK IMAGE HERE
            attrs.$set('src', '../../img/brokenlink.png');

        });

    }
}

// Build a file key - this will be what the filename is within the cache
function buildFileKey(url){
    console.log(LOG_TAG + 'Building file key for url: ' + url);
    var parts = url.split('.');
    var result = (parts.slice(0,-1).join('') + '.' + parts.slice(-1)).toString().replace(/[\/,:]/g,'_').toLowerCase();
    console.log(LOG_TAG + 'Built file key: ' + result);
    return result;
}

// Either get hold of the file from the cache or if we don't currently have it
// then attempt to download and store in the cache ready for next time
function GetFromCache(sourceUrl, success, fail) {
    console.log(LOG_TAG + 'Getting image from the cache');
    
    var fileKey = buildFileKey(sourceUrl);
    var cacheExpiry = new Date().getTime() - (86400000 * 3); // 3 days
    
    // Get the file system for temporary storage
    window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024, function(fs){
    
        console.log(LOG_TAG + 'Opened File System: ' + fs.name);
        
        // Get hold of the directory (Or create if we haven't already)
        fs.root.getDirectory(FOLDER_IMAGE_CACHE, { create:true }, function(dirEntry){
            
            var downloadToPath = dirEntry.toURL() + fileKey;
            
            // Check to see if we have the file
            doesFileExist(dirEntry, fileKey, function(fileEntry){
                
                // Update the last time this image was requested so we can
                // clear out anything that hasn't been requested in a while
                updateLastRequested(fileKey);
                
                // File exists - check if it needs to be renewed
                if (new Date(fileEntry.lastModifiedDate).getTime() < cacheExpiry){
                    console.log(LOG_TAG + 'Image has passed the expiry threshold - re-getting the file');
                    downloadFile(sourceUrl, downloadToPath, success, fail);
                }
                
                // Return the file path
                console.log(LOG_TAG + 'Passing back the image path ' + fileEntry.toURL());
                return (success(fileEntry.toURL()));
                
            }, function(){
            
                // File does not exist so download
                console.log(LOG_TAG + 'Image doesnt exist - getting file');
                downloadFile(sourceUrl, downloadToPath, success, fail);
                
            });
            
        }, fail);
        
    }, fail);

}

// Check to see if the given image already exists in our cache
function doesFileExist(dir, fileKey, existsCallback, notExistsCallback){
    console.log(LOG_TAG + 'Checking if file exists');
    
    // Check the directory for this file
    dir.getFile(fileKey, { create:false }, function(fileEntry){
        existsCallback(fileEntry);
    }, notExistsCallback);

}

// Download a file into the cache
function downloadFile(url, downloadToPath, success, fail){
    console.log(LOG_TAG + 'Downloading file ' + url);
    var fileTransfer = new FileTransfer();
    
    // File download function with URL and local path
    fileTransfer.download(encodeURI(url), downloadToPath,
        function (fileEntry) {
            console.log(LOG_TAG + 'Download Complete to path: ' + fileEntry.toURL());
            success(fileEntry.toURL());
        },
        function (error) {
            //Download abort errors or download failed errors
            console.log(LOG_TAG + 'Download Failed: ' + error.source);
            //alert("download error target " + error.target);
            //alert("upload error code" + error.code);
        }
    );
    
}


// Download a file into the cache
function deleteFile(filekey, success, fail){
    console.log(LOG_TAG + 'Deleting file ' + filekey);
    
    // Get hold of the filesystem object
    window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024, function(fs){
    
        console.log(LOG_TAG + 'Opened File System: ' + fs.name);
        
        // Get the correct directory
        fs.root.getDirectory(FOLDER_IMAGE_CACHE, { create:false }, function(dirEntry){
            
            console.log(LOG_TAG + 'Found Folder, searching for file to delete...');
            
            // Find the file
            dirEntry.getFile(filekey, { create:false, exclusive:false }, function(fileEntry){
            
                // Found the file - remove
                fileEntry.remove(function(){
                    
                    // Log the success
                    console.log(LOG_TAG + 'Deleted File Successfully');
                    
                    // Call success
                    success();
                    
                }, fail);
                             
            }, fail);
        
        }, fail);
        
    }, fail);
    
}

function setupLastUsedCache(complete){

    // Check if we have initialise our last used map
    if (LastUsedMap === null){
        
        // We will populate the variable using data stored in the localstorage
        var lastused = localStorage['DIR_IMGCACHE_LASTUSED'];
        LastUsedMap = lastused !== undefined && lastused.length > 0 ? JSON.parse(lastused) : {};
        
    }
    
    return (complete());
}

// Clear out any items that have not been requested for a while
// Remove any image that is older than a week
function clearUnusedCache(){
    console.log(LOG_TAG + 'Clearing unused cache');
    setupLastUsedCache(function(){
    
        var _clearOlderThan = new Date().getTime() - (86400000 * 7);
        var _totalCount = Object.keys(LastUsedMap).length;
        var _clearCount = 0;
        
        for(var key in LastUsedMap){
            if (LastUsedMap.hasOwnProperty(key)){
                
                // Check date
                if (LastUsedMap[key] <= _clearOlderThan){
                    
                    // Increment the quantity of items we are removing
                    _clearCount++;
                    
                    // Delete file
                    deleteFile(key, function(){
                    
                        // Deleted
                        console.log(LOG_TAG + 'Deleted cached image file ' + key);
                        
                    }, function(err){
                    
                        // Failed
                        console.log(LOG_TAG + err);
                        
                    });
                    
                }
                
            }
        }
        
        // Log the quantity we are expecting to delete
        console.log(LOG_TAG + 'Expecting to delete ' + _clearCount + ' unused files of ' + _totalCount + ' total files');
        
    });
}

function updateLastRequested(urlkey){
    setupLastUsedCache(function(){
        
        // Set the last used time for this image url
        LastUsedMap[urlkey] = new Date().getTime();
        
        // Update the local storage cache
        localStorage['DIR_IMGCACHE_LASTUSED'] = JSON.stringify(LastUsedMap);
    
    });
}



