
app.directive('cacheimg', function() {
    var LOG_TAG = 'DIR_IMGCACHE: ';
	var FOLDER_IMAGE_CACHE = 'IMAGE_CACHE';
	var DIRIMG_LastUsedMap = null;
	var hasRunClearup = false;
	var ORIGINAL_PATH = 'originalpath';
    
	
	// Find an image URL from a background image url tag
	var findImageURLFromBackgroundImage = function(elem, attrs){
		var source = '';
		var gotFromOriginalAttr = false;
		
		// Check to see if this element has already been setup
		if (elem.attr(ORIGINAL_PATH) !== undefined && elem.attr(ORIGINAL_PATH).length > 0){
			gotFromOriginalAttr = true;
			source = elem.attr(ORIGINAL_PATH);
			console.log(LOG_TAG + 'Using OriginalPath Attribute (Already been set once)');
		} else {
			source = elem.css('background-image');
		}
		
		// Check for background image
		if (source !== undefined && source !== 'none'){
			console.log(LOG_TAG + 'Found Background-Image');
			
			// Remove the URL() tags around the background source
			if (source.startsWith('url(')){
				source = source.substring(4, source.length -1);
			}

			// Retrieve from the cache (or download if we havent already)
			GetFromCache(source, function(imgPath){
				console.log(LOG_TAG + 'Got image - setting now');
				
				// Set the original path into an attribute on the element
				if (!gotFromOriginalAttr){
					elem.attr(ORIGINAL_PATH, source);
				}
				
				// Got the image, set it now
				elem.css('background-image', 'url(' + imgPath + ')');

			}, function(err){
				console.log(LOG_TAG + 'Failed to get image from cache');

				// SET BROKEN LINK IMAGE HERE
				elem.css('background-image', 'url(../../img/brokenlink.png)');

			});

		}
	};
	
	
	// Find an image from a src tag
	var findImageURLFromImgSrc = function(elem, attrs){
		var source = '';
		var gotFromOriginalAttr = false;
		
		// Check to see if this element has already been setup
		if (elem.attr(ORIGINAL_PATH) !== undefined && elem.attr(ORIGINAL_PATH).length > 0){
			gotFromOriginalAttr = true;
			source = elem.attr(ORIGINAL_PATH);
			console.log(LOG_TAG + 'Using OriginalPath Attribute (Already been set once)');
		} else {
			source = attrs.src;
		}
		
		// Check for a src tag
		if (source !== undefined){
			console.log(LOG_TAG + 'Found Src Tag');

			// Retrieve from the cache (or download if we havent already)
			GetFromCache(source, function(imgPath){
				console.log(LOG_TAG + 'Got image - setting now');
				
				// Set the original path into an attribute on the element
				if (!gotFromOriginalAttr){
					elem.attr(ORIGINAL_PATH, source);
				}
				
				// Got the image, set it now
				elem.attr('src', imgPath);

			}, function(err){
				console.log(LOG_TAG + 'Failed to get image from cache');

				// SET BROKEN LINK IMAGE HERE
				elem.attr('src', '../../img/brokenlink.png');

			});

		}
	};
	
	
	// Build a file key - this will be what the filename is within the cache
	var buildFileKey = function(url){
		console.log(LOG_TAG + 'Building file key for url: ' + url);
		var parts = url.split('.');
		var result = (parts.slice(0,-1).join('') + '.' + parts.slice(-1)).toString().replace(/[^A-Za-z0-9]/g,'_').toLowerCase();
		console.log(LOG_TAG + 'Built file key: ' + result);
		return result;
	};

	
	// Either get hold of the file from the cache or if we don't currently have it
	// then attempt to download and store in the cache ready for next time
	var GetFromCache = function(sourceUrl, success, fail) {
		
		console.log(LOG_TAG + 'Getting image from the cache. Source: ' + sourceUrl);
		
		var fileKey = buildFileKey(sourceUrl);
		var cacheExpiry = new Date().getTime() - (86400000 * 3); // 3 days
		
		// Get the file system for temporary storage
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 5 * 1024 * 1024, function(fs){
		
			console.log(LOG_TAG + 'Opened File System: ' + fs.name);
			
			// Get hold of the directory (Or create if we haven't already)
			fs.root.getDirectory(FOLDER_IMAGE_CACHE, { create:true }, function(dirEntry){
				
				var downloadToPath = dirEntry.toURL() + fileKey;
				console.log(LOG_TAG + 'Local Path: ' + downloadToPath);
				
				// Check to see if we have the file
				doesFileExist(dirEntry, fileKey, function(fileEntry){
					console.log(LOG_TAG + 'Image already exists');
					
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

	};
	

	// Check to see if the given image already exists in our cache
	var doesFileExist = function(dir, fileKey, existsCallback, notExistsCallback){
		
		console.log(LOG_TAG + 'Checking if file exists ' + fileKey);
		
		// Check the directory for this file
		dir.getFile(fileKey, { create:false }, function(fileEntry){
			console.log(LOG_TAG + 'File: ' + fileKey + ' does exist already');
			return (existsCallback(fileEntry));
		}, function(){
			console.log(LOG_TAG + 'File: ' + fileKey + ' does not exist');
			return (notExistsCallback());
		});

	};
	

	// Download a file into the cache
	var downloadFile = function(url, downloadToPath, success, fail){
		
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
		
	};


	// Download a file into the cache
	var deleteFile = function(filekey, success, fail){
		
		console.log(LOG_TAG + 'Deleting file ' + filekey);
		
		// Get hold of the filesystem object
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 5 * 1024 * 1024, function(fs){
		
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
		
	};
	

	// Setup the last used cache
	var setupLastUsedCache = function(complete){
		
		// Check if we have initialise our last used map
		if (DIRIMG_LastUsedMap === null){
			
			// We will populate the variable using data stored in the localstorage
			var lastused = localStorage['DIR_IMGCACHE_LASTUSED'];
			DIRIMG_LastUsedMap = lastused !== undefined && lastused.length > 0 ? JSON.parse(lastused) : {};
			
		}
		
		return (complete());
	};
	

	// Clear out any items that have not been requested for a while
	// Remove any image that is older than a week
	var clearUnusedCache = function(){
		
		console.log(LOG_TAG + 'Clearing unused cache');
		setupLastUsedCache(function(){
		
			var _clearOlderThan = new Date().getTime() - (86400000 * 7);
			var _totalCount = Object.keys(DIRIMG_LastUsedMap).length;
			var _clearCount = 0;
			
			var removefile = function(key){
				console.log(LOG_TAG + 'Removing key ' + key);
				
				// Delete file
				deleteFile(key, function(){
				
					// Deleted
					console.log(LOG_TAG + 'Deleted cached image file ' + key);
					
					// Remove from the map
					delete DIRIMG_LastUsedMap[key]
					
					// Update the local storage cache
					localStorage['DIR_IMGCACHE_LASTUSED'] = JSON.stringify(DIRIMG_LastUsedMap);
	
				}, function(err){
					
					// Remove from the map
					delete DIRIMG_LastUsedMap[key]
					
					// Update the local storage cache
					localStorage['DIR_IMGCACHE_LASTUSED'] = JSON.stringify(DIRIMG_LastUsedMap);
					
					// Failed
					console.log(LOG_TAG + err);
					
				});
			};
			
			for(var key in DIRIMG_LastUsedMap){
				if (DIRIMG_LastUsedMap.hasOwnProperty(key)){
					// Check date
					if (DIRIMG_LastUsedMap[key] <= _clearOlderThan){
						
						// Increment the quantity of items we are removing
						_clearCount++;
						
						// Delete file
						removefile(key);
						
					}
					
				}
			}
			
			// Log the quantity we are expecting to delete
			console.log(LOG_TAG + 'Expecting to delete ' + _clearCount + ' unused files of ' + _totalCount + ' total files');
			
		});
	};
	

	// Update the last time this url was requested
	var updateLastRequested = function(urlkey){
		setupLastUsedCache(function(){
			
			// Set the last used time for this image url
			DIRIMG_LastUsedMap[urlkey] = new Date().getTime();
			
			// Update the local storage cache
			localStorage['DIR_IMGCACHE_LASTUSED'] = JSON.stringify(DIRIMG_LastUsedMap);
		
		});
	};
	
	
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
                return elem.style;
            },  function(){
                
                console.log(LOG_TAG + 'Background-image has triggered the watch.');
             
                // Style has been changed so check image hasn't been modified
                findImageURLFromBackgroundImage(elem, attrs);

            }, true);

            scope.$watch(function () {
                return attrs.src;
            },  function(){
                
                console.log(LOG_TAG + 'Img src has triggered the watch.');
                
                // Image source has been changed so check image hasn't been modified
                findImageURLFromImgSrc(elem, attrs);

            }, true);

        }
    };
	
});
