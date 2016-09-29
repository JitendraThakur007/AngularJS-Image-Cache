# AngularJS-Image-Cache
Image Cache script for an AngularJS project running on Cordova/Phonegap

Requirements:
AngularJS
Cordova
Cordova-Plugin-File
Cordova-Plugin-File-Transfer

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

