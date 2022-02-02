# Page

If you want to create a page, you should create 2 files:

- page1.html
- page1.js

In the html file, you should ensure there will be only 1 root tag. And you can use all of the Vue syntax like `v-bind:...`, `v-for`, etc.

```
<div>
	...
</div>
```

In the js file, you should invoke `Page(<options>)` method, the `options` is the component definition in Vue. 

```
Page({
    layout: '/shared/_layout',
    modules: [
        "https://cdn.jsdelivr.net/npm/marked/marked.min.js"
    ],
    data() {
        return {
            id: null,
            content: null
        }
    },
    created() {
        var self = this;
        var _result;
        if (this.id) { 
            fetch('/content/' + this.id + '.md').then(function (result) {
                return result.text();
            }).then(function (result) {
                _result = result;
                self.content = marked.parse(_result);
            });
        }
    }
});
```

## Modules

You can declare the js `modules` which you need. Pomelo will help you resolve these scripts. 

## Layout

You can declare you want to use a layout frame by specifying a `layout`. Without `layout`, you should put full HTML(`<html>`, `<head>`, `<body>`, etc.) in html file.

Click [here](/docs/layout) to see more details for layout