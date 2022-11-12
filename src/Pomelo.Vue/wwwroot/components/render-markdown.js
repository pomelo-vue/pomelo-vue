var marked = require("https://cdn.bootcdn.net/ajax/libs/marked/4.0.2/marked.js");

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
        // Module based
        // this.rendered = marked.parse(this.$props.content);

        // CommonJS based
        this.rendered = marked.parse(this.$props.content);
    }
});