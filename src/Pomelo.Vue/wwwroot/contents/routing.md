# Routing

Pomelo-Vue supports set routing rules, you just need to put a `/shared/_route.json` file in your website.

```
{
  "/": "page",
  "/docs/{id}": "/page",
  "/standalone": "/standalone"
}
```

When Pomelo matched URL-View mapping. Pomelo will load the specified view automatically. And the arguments in the rule will be parsed and pass into the data of view.

## Reg Exp Matching

You can define a regexp to matching the URLs as below:
```
{
  "/docs/{id:[a-zA-Z0-9_-]{1,}}": "/page"
}
```

## Not Found Page

You should specify a not found page in your `_routes.json`. It will redirect to this view when the rules are not matched.

```
{
	"/404": "/shared/_404"
}
```
