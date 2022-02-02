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