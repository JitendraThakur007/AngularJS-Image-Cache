# AngularJS-Image-Cache
This directive is a simple to use image caching handler built to store and maintain requested images in your Cordova AngularJS project. 

This has been updated since the first version. The previous version would monitor changes from the src and background-image attributes on whatever element you were using. This has now been scrapped - you now add a 'img-src' attribute onto your element which will be watched for changes, on change the directive will get this source and depending on the element in use; will populate either the src or background-image attribute itself.

The first time an image is loaded will be slower the any following requests, I have added in a sessionStorage cache to hold the local file location on first load. Second loads can take less than 2ms (This is improved over the last version that kept diving into the FileSystem which was taking between 200-900ms per load!)

Requirements:
- Cordova-Plugin-File
- Cordova-Plugin-File-Transfer

How to use:

Copy the  script into your project.
Link the script with (using the correct directory structure to your project)
```html
<script type="text/javascript" src="js/directives/dir_imgcache.js"></script>
```

Rename the ``app.directive('cacheimg', function() { `` line  to read ``[yourappname].directive...``

Then simply add the  ''cacheimg'' attribute to your element as below:

```html
// Handling a background-image source
<div cacheimg img-src="img/myimage.png"></div>

// Handling an image element source
<img cacheimg img-src="img/myimage.png" />

// Handling a AngularJS scoped image background source
<div cacheimg img-src="item.myimagesource"></div>
```

