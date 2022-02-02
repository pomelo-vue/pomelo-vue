# External Modules

In our daily web development, we always using 3rd-party libraries like `marked.js`, `moment.js`, etc. We can declare the usage in `Page`, `Component` and `Layout`.

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