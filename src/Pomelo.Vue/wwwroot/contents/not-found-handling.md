# Not Found Handling

In Pomelo, we have a built-in handler for not found URLs.

You should specify a not found page in your `_routes.json`. It will redirect to this view when the rules are not matched.

```
{
	"/404": "/shared/_404"
}
```

You can also override the built-in behavior. 

```
Pomelo.SetOptions({
	onNotFound: function(url, options) {
		...
	}
});
```

The built-in `onNotFound` function is defined as below.

```
if (url.indexOf('/404') == 0) {
    throw 'No not-found template found';
}
if (options) {
    return Pomelo.Redirect('/404?' + SerializeOptionsToUrl(options));
} else {
    return Pomelo.Redirect('/404');
}
```