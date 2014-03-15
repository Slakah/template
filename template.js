"use strict";

var tagRegex = /@([\w_]+)/g;

function Multimap() {
    this.map = {};
    
    
    this.reverse = function() {
        var reversed = new Multimap();
        for (var key in this.map) {
            var values = this.map[key];
            for (var value in values) {
                reversed.put(value, key);
            }
        }
        return reversed;
    };
    
    this.get = function(key) {
        return this.map[key];
    };
    
    this.removeAll = function(key) {
        delete this.map[key];
    };
    
    this.remove = function(key, value) {
        delete this.map[key][value];
    };
    
    this.put = function(key, value) {
        this.map[key] = this.map[key] || {};
        this.map[key][value] = true;
    };   
}

function Callback() {
    var callbacks = [];
    
    this.call = function(thisArg, args) {
        callbacks.forEach(function(callback) {
            callback.apply(thisArg, args);
        });
    };
    
    this.register = function(callback) {
        callbacks.push(callback);
    };
}

function Tags(mainTag) {
    var tagPool = {main: mainTag};
    this.evaluatedTags = {};
    this.dependencies = new Multimap();
    this.reverseDependencies;
    
    var newTagCallback = new Callback();
    var uneededTagCallback = new Callback();
    
    var self = this;
    var evaluateTag = function(tag) {
        var evaluatedTags = self.evaluatedTags;
        
        if (tag in evaluatedTags) return evaluatedTags[tag];
        
        if (!(tag in tagPool)) {
            newTagCallback.call(self, [tag]);
            tagPool[tag] = tag;
        }

        var evaluatedTag = tagPool[tag].replace(tagRegex, 
            function(_, matchTag) {
                self.dependencies.put(tag, matchTag);
                return evaluateTag(matchTag);
            }
        );

        evaluatedTags[tag] = evaluatedTag;
        return evaluatedTag;
    };
    
    var invalidateUp = function(tag) {
        var upTags = self.reverseDependencies.get(tag);

        for (var toInvalidate in upTags) {
            delete self.evaluatedTags[toInvalidate];
            invalidateUp(toInvalidate);
        }
    };
    
    var invalidateTag = function(tag) {
        for (var dependency in self.dependencies.get(tag)) {
            self.reverseDependencies.remove(dependency, tag);
        }

        invalidateUp(tag);
    };

    
    this.process = function() {
        var result = evaluateTag("main");
        this.reverseDependencies = this.dependencies.reverse();
        return result;
    };
    
    this.put = function(tag, s) {
        delete this.evaluatedTags[tag];
        invalidateTag(tag);
        tagPool[tag] = s;
    };
    
    
    this.onNewTag = function(f) {
        newTagCallback.register(f);
    };
    
    this.onUneededTag = function(f) {
        uneededTagCallback.register(f);
    };
}




var tagPool = {
    main : "the @animal @action at @time",
    animal : "cat",
    action : "ate @food",
    food : "@cat_food",
    cat_food: "a fish",
    time: "quarter past three"
};


var tags = new Tags(tagPool.main);
tags.onNewTag(function(tag) {
    console.log(tag);
});
console.log(tags.process());


tags.put("yo", "teat");
console.log(tags.process());


