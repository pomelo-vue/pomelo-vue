# Routing

Pomelo-Vue supports set routing rules, you just need to put a `route.json` file in the web root.

```
{
  "/": "page",
  "/docs/{id}": "/page",
  "/standalone": "/standalone"
}
```

When Pomelo matched URL-View mapping. Pomelo will load the specified view automatically. And the arguments in the rule will be parsed and pass into the data of view.