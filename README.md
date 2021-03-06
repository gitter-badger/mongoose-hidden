# mongoose-hidden

[![build status](http://img.shields.io/travis/mblarsen/mongoose-hidden.svg)](http://travis-ci.org/mblarsen/mongoose-hidden) [![Dependencies](http://img.shields.io/david/mblarsen/mongoose-hidden.svg
)](https://david-dm.org/mblarsen/mongoose-hidden) [![Coverage Status](https://coveralls.io/repos/github/mblarsen/mongoose-hidden/badge.svg?branch=master)](https://coveralls.io/github/mblarsen/mongoose-hidden?branch=master) ![NPM version](http://img.shields.io/npm/v/mongoose-hidden.svg) [![Support via Gittip](http://img.shields.io/gittip/mblarsen.svg?style=flat)](https://www.gittip.com/mblarsen/) [![Get help on Codementor](https://cdn.codementor.io/badges/get_help_github.svg)](https://www.codementor.io/mblarsen?utm_source=github&utm_medium=button&utm_term=mblarsen&utm_campaign=github)

[![NPM](https://nodei.co/npm/mongoose-hidden.png?downloads=true)](https://nodei.co/npm/mongoose-hidden/)

A Mongoose schema plugin that hooks into `toJSON()` and `toObject()` to allow filtering of properties you usually do not want to sent client-side.

# Install

`npm install mongoose-hidden`

# Usage

    var mongoose = require('mongoose'),
        Schema = mongoose.Schema,
        mongooseHidden = require('mongoose-hidden')(defaults);

    var UserSchema = new Schema(
        name: String,
        password: { type: String, hide: true },
        email: String
    );

    UserSchema.plugin(mongooseHidden);

    var User = mongoose.model('User', UserSchema);
    var user = new User({ name: "Joe", email: "joe@example.com", password: "secret" });
    user.save(function() {
        var jsonUser = user.toJSON();
        console.log(jsonUser);
        // Outputs: { name: "Joe", email: "joe@example.com" }
    });

In stead of `hide: true` you can specify the property to only be hidden for `toJSON` or `toObject` be writing: `hideJSON: true` or `hideObject` respectively.

Optionally you can use a `function` for `hide`, `hideJSON` or `hideObject`. The function has the following signature and must return `true` if the property should be filtered:

    function (doc, ret) {
        // return true to filter
    }

The parameters `doc` and `ret` are passed in from the transform function. See `toJSON` and `toObject` in the Mongoose documentation.

### Default Hidden

By default `_id` and `__v` properties are hidden when calling either `toJSON` or `toObject`. You can override this behaviour, when you load the plugin:

    var mongooseHidden = require("mongoose-hidden")({ defaultHidden: { password: true } });
    UserSchema.plugin(mongooseHidden);

By default `password` and only `password` will be hidden. You don't need to specify `hide: true` in the schema.

To really make use of this feature, make sure to pass in your defaults in a variable like this:

    // app.js
    var modelConfig = { defaultHidden: { password: true } };
    require ('./models/user')(modelConfig);

    // models/user.js
    module.exports = function (config) {
        var mongooseHidden = require('mongoose-hidden')(config);

        ... schema stuff ...

        schema.plugin(mongooseHidden);

        ... profit! ...
    };

A different way to configure default hidden properties, is when applying the plugin to the schema:

    UserSchema.plugin(mongooseHidden, { defaultHidden: { password: true } });

Doing it this way instead of adding it to the schema directly allows you to conditionally hide properties. E.g.

    if (app === 'web') {
        UserSchema.plugin(mongooseHidden, { defaultHidden: { "_id": true, password: true } });
    } else if (app == 'private-api') {
        UserSchema.plugin(mongooseHidden, { defaultHidden: { password: true } });
    } else {
        UserSchema.plugin(mongooseHidden);
    }

So depending on the app using the model, different properties would be hidden.

Note: you can change the default behaviour for this `defaultHidden` properties by using `autoHideJSON` and `autoHideObject` in the same way (but only when instantiating the module):

    var mongooseHidden = require("mongoose-hidden")({ autoHideObject: false });

What this does, is that when you invoke `toObject` the default hidden properties will no longer be exclude, but they will when invoking `toJSON`.

### Virtuals (since 0.3.1)

Hiding of virtuals can be done as well.

    schema.set('toJSON', { virtuals: true });
    schema.set('toObject', { virtuals: true });
    schema.plugin(mongooseHidden, { virtuals: { fullname: 'hideJSON' }});

Be sure to include the plugin after you turn on virtuals.

The value of the virtuals key can be: `hide`, `hideJSON` and `hideObject`, but remember that if you don't turn on virtuals for `toObject`, `fullname` in the above example will NOT be hidden, even though it specifies that only JSON is hidden.

## Transform (since 0.6)

The plugin makes use of `toJSON` and `toObject`'s _transform-functionality_ to hide values. You can set a transform function prior to applying the plugin. The plugin will then invoke that function before hiding properties.

    var mongooseHidden = require("mongoose-hidden")({ defaultHidden: { password: true } });

    // First define transform function
    UserSchema.set('toJSON', { transform: function (doc, ret, opt) {
        ret["name"] = "Mr " + ret["name"];
        return ret;
    }});
    
    // Then apply plugin
    UserSchema.plugin(mongooseHidden);
    
All names will now be prefixed with "Mr" and passwords will be hidden of course.

# Changes

**0.6.0**

New: If a `transform` has already been set before loading plugin that function will be applied before applying plugin tranforms. 
 
Other: Reduced code size.

**0.4.0**

Changed: Default `virtuals` value set to `{ }` meaning `id` will no longer be hidden by default.

**0.3.2**

Fixed: `id` virtual was included by mistake in `0.3.1`.

**0.3.1**

New: Introduced hiding of virtuals.

**0.3.0**

Changed: `require("mongoose-hidden")` is now `require("mongoose-hidden")(defaults)` with optional defaults.

# Limitations

* Always set `{ getters: true, virtuals: true }` before installing plugin:  

    schema.set('toJSON', { getters: true, virtuals: true });
    schema.plugin(require(mongooseHidden));
    
* If there is a transform function defined already it will be overridden. Fix planned.
* Recursive use of hide not supported.

# TODO

* ~~If there is a transform function defined on `toJSON` and `toObject` apply that first and then run the hide function.~~ _Implemented in v0.6_
* Implement turning on and off on a single invocation (if possible). Something like this:

    `var jsonUser = user.toJSON({ hide: false });`
