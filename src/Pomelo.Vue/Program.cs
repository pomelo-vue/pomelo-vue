using Pomelo.Vue.Middleware;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseStaticFiles();
app.UsePomeloVueMiddleware(x => 
{
    x.Branch = PomeloVueBranch.Prod;
    x.Charset = "utf-8";
    x.UseCacheQuery = true;
    x.UseCommonJs = true;
    x.BypassUrlPrefixes = new List<string> { "/api/" };
    x.MappingPomeloVueJs = true;
    x.MappingBase = "/assets/js/";
    x.AssetsVersion = "2022112901";
});

app.Run();
