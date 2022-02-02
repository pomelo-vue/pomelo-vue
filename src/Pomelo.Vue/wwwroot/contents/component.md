# Component

Pomelo-vue supports developers define common components that can be shared in different pages, layouts, etc. In your page or layout definition script, you should declare them in `components`.

```
Page({
    layout: '/shared/_layout',
    components: [
        "/components/render-markdown"
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

        if (!this.id) {
            this.id = 'installation';
        }

        return fetch('/contents/' + this.id + '.md').then(function (result) {
            return result.text();
        }).then(function (result) {
            _result = result;
            self.content = _result;
        });
    },
    mounted() {
        this.$root.id = this.id;
    }
});
```

In the above page difinition, we declared this page is using the component `/components/render-markdown`.

Then we should create following files

- /components/render-markdown.html
- /components/render-markdown.js

In `/components/render-markdown.html`, we should define the view HTML template for this component

```
<div v-html="rendered"></div>
```

Then we define the logics for this component in `/components/render-markdown.js`

```
Component('render-markdown', {
    props: ['content'],
    modules: [
        "https://cdn.bootcdn.net/ajax/libs/marked/4.0.2/marked.js"
    ],
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

Finally, we can use this component in any views

```
<render-markdown v-if="content" v-bind:content="content"></render-markdown>
```