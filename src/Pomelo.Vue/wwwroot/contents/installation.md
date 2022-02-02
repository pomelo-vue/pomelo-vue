# Installation

Add `vue.js` and `pomelo.js` into html header.

```
<html>
	<head>
		<script src="/js/vue.js"></script>
		<script src="/js/pomelo.js"></script>
	</head>
</html>
```

Make sure your host always return the above page when the requested resource is not existing. 

For ASP.NET Core, you can use the middleware as below:

```
namespace Pomelo.Vue.Template
{
    public class PueMiddleware
    {
        private readonly RequestDelegate _next;

        private readonly string _main;

        internal static string VuePath = "";
        internal static string PomeloPath = "";

        public PueMiddleware(RequestDelegate next)
        {
            _next = next;
            _main = $"<html><head><script src=\"{VuePath}\"></script><script src=\"{PomeloPath}\"></script></head></html>";
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
        public static IApplicationBuilder UsePueMiddleware(this IApplicationBuilder builder, string vuePath = "/assets/js/vue.js", string pomeloPath = "/assets/js/pomelo.js")
        {
            PueMiddleware.VuePath = vuePath;
            PueMiddleware.PomeloPath = pomeloPath;
            return builder.UseMiddleware<PueMiddleware>();
        }
    }
}
```