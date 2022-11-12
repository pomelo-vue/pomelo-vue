# External Modules

In our daily web development, we always using 3rd-party libraries like `marked.js`, `moment.js`, etc. There are 2 ways to introduce the 3rd party javascript librraries into Pomelo VUE project.

## Declare in options

We can declare the usage in `Page`, `Component` and `Layout`.

For example, this component is using `marked.js` by declare it in `modules` field.

```
Component('render-markdown', {
    modules: [
        "https://cdn.bootcdn.net/ajax/libs/marked/4.0.2/marked.js"
    ],
    ...
});
```

After you declared the module usage, you can use the exported variables, functions which contained in the external libraries.

## Pomelo Common JS

First, you should add the `pomelo.commonjs.js` reference into your root HTML page.

```
https://unpkg.com/pomelo-vue/pomelo.commonjs.js
```

Then, you can use `require(<url>)` to introduce the library into javascript runtime.

```
var marked = require("https://cdn.bootcdn.net/ajax/libs/marked/4.0.2/marked.js");

Component('render-markdown', {
    props: ['content'],
    data() {
        return {
            rendered: null
        }
    },
    created: function () {
        this.rendered = marked.parse(this.$props.content);
    }
});
```