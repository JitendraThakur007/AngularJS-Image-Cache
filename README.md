# AngularJS-Image-Cache
This directive is a simple to use image caching handler built to store and maintain requested images in your Cordova AngularJS project. 

The basics of how this work are; the directive will monitor src and background-image changes on the element you have instructed it to monitor (by use of the cacheimg attribute). The directive will then fetch the image source, convert it into a storable key value (this becomes the filename)  and downloads and writes the file to a temporary storage location on your device. 
On each initial run a clear up function is called which deletes any file that hasn't been requested within 7 days (modify this as you see fit)  - we do this because we don't want to rely on the OS to remove files and we want to keep things clean.

We have to use a $watch on the attributes for when the source is populated using an AngularJS scope variable, the reason behind this is because the directory ends up being run prior to the variable being set. If you are not going to be using the directive to handle scope populated sources then I suggest you alter the directive to remove the $watch calls

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
<div cacheimg style="background-image:url(img/myimage.png);"></div>

// Handling an image element source
<img cacheimg src="img/myimage.png" />

// Handling a AngularJS scoped image background source
<div cacheimg style="background-image:url({{ item.myimagesource }});"></div>
```

