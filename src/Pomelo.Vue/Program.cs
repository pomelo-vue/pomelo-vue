using Pomelo.Vue.Middleware;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseStaticFiles();
app.UsePomeloVueMiddleware();

app.Run();
