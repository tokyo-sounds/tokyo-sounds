"use strict";
exports.__esModule = true;
exports.metadata = void 0;
var google_1 = require("next/font/google");
require("./globals.css");
var sonner_1 = require("@/components/ui/sonner");
var stack_1 = require("@stackframe/stack");
var client_1 = require("../stack/client");
var next_1 = require("@vercel/analytics/next");
var robotoSans = google_1.Roboto({
    variable: "--font-roboto-sans",
    subsets: ["latin"]
});
var robotoMono = google_1.Roboto_Mono({
    variable: "--font-roboto-mono",
    subsets: ["latin"]
});
var notoSansJp = google_1.Noto_Sans_JP({
    variable: "--font-noto-jp",
    subsets: ["latin"]
});
exports.metadata = {
    title: "東京の音 | 東京の日常音を集めたASMRサイト",
    description: "東京の雰囲気・電車・商店街・寺社・カフェなどの生活音をASMR化。東京を歩いている体験ができるWEBサイト。 "
};
function RootLayout(_a) {
    var children = _a.children;
    return (React.createElement("html", { lang: "ja" },
        React.createElement("body", { className: robotoSans.variable + " " + robotoMono.variable + " " + notoSansJp.variable + " antialiased" },
            React.createElement(stack_1.StackProvider, { app: client_1.stackClientApp },
                React.createElement(stack_1.StackTheme, null, children),
                React.createElement(sonner_1.Toaster, null)),
            React.createElement(next_1.Analytics, null))));
}
exports["default"] = RootLayout;
