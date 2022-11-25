using Pomelo.Vue.Middleware;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseStaticFiles();
app.UsePomeloVueMiddleware(x => 
{
    x.Branch = PomeloVueBranch.ProdMin;
    x.Charset = "utf-8";
    x.UseCacheQuery = true;
    x.UseCommonJs = true;
    x.BypassUrlPrefixes = new List<string> { "/api/" };
    x.MappingPomeloVueJs = true;
    x.MappingBase = "/assets/js";
});

app.Run();
