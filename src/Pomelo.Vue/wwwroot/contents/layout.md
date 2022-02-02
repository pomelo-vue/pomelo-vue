# Layout

## What is layout

Layout always contains header, navigation, footer. These elements' behaviors always are fixed. In other words, we always put the common elements into layout.

![Layout](/contents/layout/layout-1.png)

## Define a layout

You can define a layout by creating 2 files

- /shared/_layout.html
- /shared/_layout.js

### Layout Template

In layout template, we should create full HTML page, it means you should make sure `<html>`, `<head>`, `<body>` tags are put in this template.

You should also make sure `pue.js` is referred in `<head>`.

```
<html lang="en">
<head>
    <title>Site Title</title>
    <script src="/assets/js/pue.js"></script>
</head>
<body>
    <div class="header"></div>
    <div class="nav"></div>
    <div class="body">
        <render-body></render-body>
    </div>
    <div class="footer"></div>
</body>
</html>
```

Besides, you should add `<render-body></render-body>` into the template. This is the anchor to render pages.

### Layout Script

You should invoke `Layout` method to declare logics for this layout. The arguments of this method is similar to `Page`, `Component`.

```
Layout({
    data() {
        return {
            id: null,
            catalog: []
        }
    },
    created() {
        var self = this;
        return fetch('/contents/docs.json').then(function (result) {
            return result.text();
        }).then(function (result) {
            self.catalog = JSON.parse(result);
        });
    }
});
```

### Use Layout In A Page

In page definition, you can specify `layout` in options.

```
Page({
    layout: '/shared/_layout',
    ...
});
```