﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Pomelo.Vue.Middleware
{
    public class PomeloVueMiddlewareOptions
    {
        public PomeloVueMiddlewareOptions()
        {
        }

        public PomeloVueBranch Branch { get; set; } = PomeloVueBranch.ProdMin;

        public bool UseCacheQuery { get; set; } = true;

        public bool UseCommonJs { get; set; } = true;

        public string Charset { get; set; } = "utf-8";

        public bool MappingPomeloVueJs { get; set; } = true;

        public string MappingBase { get; set; } = "/assets/js/";

        public string ConfigureJs { get; set; } = "/assets/js/pomelo.config.js";

        public List<string> BypassUrlPrefixes { get; set; } = new List<string> { "/api/" };

        public List<string> ProxyUrlPrefixes { get; set; } = new List<string>();

        public bool ProxyAllByDefault { get; set; } = true;

        public string AssetsVersion { get; set; }
    }

    public class PomeloVueMiddleware
    {
        private readonly RequestDelegate _next;

        private readonly string _main;

        private readonly PomeloVueMiddlewareOptions _options;

        public PomeloVueMiddleware(RequestDelegate next, PomeloVueMiddlewareOptions options)
        {
            _next = next;
            _options = options;
            _main = BuildPomeloVueDefaultHtml(options);
        }

        private IEnumerable<string> JavaScripts 
            => PomeloVueBranchFileName
                .Concat(PomeloVueBranchCacheQueryFileName)
                .Concat(PomeloVueBranchCommonJsFileName)
                .Distinct();

        private IEnumerable<string> JavaScriptEndpoints 
            => JavaScripts.Select(x => _options.MappingBase + x);

        public async Task Invoke(HttpContext httpContext)
        {
            if (_options.MappingPomeloVueJs)
            {
                var endpoint = httpContext.Request.Path.ToString();
                if (JavaScriptEndpoints.Any(x => x == endpoint))
                {
                    var fileName = Path.GetFileName(endpoint);
                    var executingPath = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
                    await httpContext.Response.WriteAsync(await File.ReadAllTextAsync(Path.Combine(executingPath, fileName)));
                    await httpContext.Response.CompleteAsync();
                    httpContext.Response.Body.Close();
                    return;
                }
            }

            if (_options.BypassUrlPrefixes.Any(x => httpContext.Request.Path.ToString().StartsWith(x, StringComparison.OrdinalIgnoreCase)))
            {
                await _next(httpContext);
                return;
            }

            if (_options.ProxyAllByDefault || _options.ProxyUrlPrefixes.Any(x => httpContext.Request.Path.ToString().StartsWith(x, StringComparison.OrdinalIgnoreCase)))
            {
                await httpContext.Response.WriteAsync(_main);
                await httpContext.Response.CompleteAsync();
                httpContext.Response.Body.Close();
                return;
            }

            await _next(httpContext);
        }

        private static string BuildPomeloVueDefaultHtml(PomeloVueMiddlewareOptions options)
        {
            return $@"<!DOCTYPE html>
<html>
<head>
    <meta charset=""{options.Charset}"" />
    <title></title>
    {(options.UseCommonJs ? ($"<script src=\"{options.MappingBase}{GenerateAssetsWithVersion(PomeloVueBranchCommonJsFileName[(int)options.Branch], options.AssetsVersion)}\"></script>") : "")}
    <script src=""{GenerateAssetsWithVersion(options.ConfigureJs, options.AssetsVersion)}""></script>
    <script>if (!window.PomeloVueOptions) {{ window.PomeloVueOptions = {{}}; }} window.PomeloVueOptions.version = '{options.AssetsVersion}';</script>
    <script src=""{options.MappingBase}{GenerateAssetsWithVersion(PomeloVueBranchFileName[(int)options.Branch], options.AssetsVersion)}""></script>
    {(options.UseCacheQuery ? ($"<script src=\"{options.MappingBase}{GenerateAssetsWithVersion(PomeloVueBranchCacheQueryFileName[(int)options.Branch], options.AssetsVersion)}\"></script>") : "")}
</head>
</html>";
        }

        private static string GenerateAssetsWithVersion(string asset, string version)
        {
            if (string.IsNullOrWhiteSpace(version))
            {
                return asset;
            }
            else if (asset.Contains("?"))
            {
                return asset + "&v=" + version;
            }
            else
            {
                return asset + "?v=" + version;
            }
        }

        private static readonly string[] PomeloVueBranchFileName = new[]
        {
            "pomelo.vue.min.js",
            "pomelo.vue.js",
            "pomelo.vue.dev.min.js",
            "pomelo.vue.dev.js"
        };

        private static readonly string[] PomeloVueBranchCacheQueryFileName = new[]
        {
            "pomelo.cachequery.min.js",
            "pomelo.cachequery.js",
            "pomelo.cachequery.min.js",
            "pomelo.cachequery.js"
        };

        private static readonly string[] PomeloVueBranchCommonJsFileName = new[]
        {
            "pomelo.commonjs.min.js",
            "pomelo.commonjs.js",
            "pomelo.commonjs.min.js",
            "pomelo.commonjs.js"
        };
    }

    public enum PomeloVueBranch
    { 
        ProdMin,
        Prod,
        DevMin,
        Dev
    }

    public static class PueMiddlewareExtensions
    {
        public static IApplicationBuilder UsePomeloVueMiddleware(
            this IApplicationBuilder builder, 
            Action<PomeloVueMiddlewareOptions> configureOptions = null)
        {
            var options = new PomeloVueMiddlewareOptions();
            configureOptions?.Invoke(options);
            return builder.UseMiddleware<PomeloVueMiddleware>(options);
        }
    }
}
