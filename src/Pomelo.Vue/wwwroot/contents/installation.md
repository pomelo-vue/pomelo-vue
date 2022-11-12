# Installation

Add `pue.js` into html header.

```
<html>
	<head>
		<script src="https://unpkg.com/pomelo-vue"></script>
	</head>
</html>
```

You can also use the compressed version: 

```
https://unpkg.com/pomelo-vue/pomelo.vue.min.js
```

Make sure your host always return the above page when the requested resource is not existing. 

For ASP.NET Core, you can use the middleware as below:

```
namespace Pomelo.Vue
{
    public class PueMiddleware
    {
        private readonly RequestDelegate _next;

        private readonly string _main;

        internal static string PuePath = "";

        public PueMiddleware(RequestDelegate next)
        {
            _next = next;
            _main = $"<html><head><script src=\"{PuePath}\"></script></head></html>";
        }

        public async Task Invoke(HttpContext httpContext)
        {
            var env = httpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();
            var path = Path.Combine(env.WebRootPath, httpContext.Request.Path.ToString().Split('?')[0].Trim('/'));
            if (File.Exists(path + ".html") || File.Exists(path + "/index.html") || File.Exists(path + ".m.html") || File.Exists(path + "/index.m.html") || File.Exists(path + "/main.html"))
            {
                httpContext.Response.StatusCode = 200;
                httpContext.Response.ContentType = "text/html";
                if (File.Exists(path + ".html") && path.Substring(env.WebRootPath.Length).Trim('/').IndexOf('/') == -1)
                {
                    await httpContext.Response.WriteAsync(File.ReadAllText(path + ".html"));
                }
                else if (File.Exists(path + ".m.html") && path.Substring(env.WebRootPath.Length).Trim('/').IndexOf('/') == -1)
                {
                    await httpContext.Response.WriteAsync(File.ReadAllText(path + ".m.html"));
                }
                else
                {
                    await httpContext.Response.WriteAsync(_main);
                }
                await httpContext.Response.CompleteAsync();
                httpContext.Response.Body.Close();
                return;
            }
            else if (string.IsNullOrEmpty(Path.GetExtension(path))) 
            {
                await httpContext.Response.WriteAsync(_main);
                await httpContext.Response.CompleteAsync();
                httpContext.Response.Body.Close();
                return;
            }
            await _next(httpContext);
        }
    }

    public static class PueMiddlewareExtensions
    {
        public static IApplicationBuilder UsePueMiddleware(this IApplicationBuilder builder, string puePath = "/assets/js/pomelo.vue.js")
        {
            PueMiddleware.PuePath = puePath;
            return builder.UseMiddleware<PueMiddleware>();
        }
    }
}
```