/**
 * r3bb
 * ~~~~
 *
 * jQuery plugin that provides a tiny (not tiny in the sense of tinyMCE, but
 * really tiny) WYSIWYG-Editor that outputs BB-Code instead of HTML. This way
 * it's much easier to display this without worrying about correct escaping.
 *
 * :copyright: 2009, Pascal Hartig <phartig@rdrei.net>
 * :license: Dual licensed under the MIT and GPL licenses.
 * _``http://docs.jquery.com/License``
 */

/*global jQuery, window */
/*jslint white: true, onevar: true, browser: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true */
"use strict";

(function ($) {
    /**
     * Use it on any textarea like
     * $("textarea:first").r3bb()
     * to replace it with a small WYSIWYG editor.
     *
     * @param options['debug']: Boolean, turn debug mode on or off.
     * @param options['copy_value']: Boolean. Copy existing content from text area to
     * RTE.
     * @param options['stylesheet']: Stylesheet URL to include in editor.
     */
    $.fn.r3bb = function (options) {
        var settings = {
            debug: false,
            copy_value: true,
            stylesheet: null
        },
            markup = ['<div class="r3bb">',
                     '<nav><button class="btn-bold">B</button>',
                     '<button class="btn-italic">I</button>',
                     '<button class="btn-underline">',
                     'U</button></nav></div>'].join("\n");

        $.extend(settings, options);

        // This allows us to 'unobtrusively' debug everything regardless of
        // whether firebug or webkit developer kit is available.
        function log() {
            if (window.console !== undefined && $.isFunction(console.log) &&
                settings.debug) {
                console.log.apply(console, arguments);
            }
        }

        log("Debug mode enabled.");

        return $(this).each(function () {
            var $this = $(this),
                $rte = null,
                $r3bb = null,
                // Save original dimensions
                twidth = $this.css('width'),
                theight = $this.css('height'),
                editor = null;

            function on_button_clicked() {
                // Detect button type on class name.
                var btn_type = $(this).attr('class').split('btn-')[1];
                log("Button of type %o clicked.", btn_type);

                // Note that $this is not the button, but the textarea.
                $this.trigger('r3bb-button-clicked', {
                    type: 'click',
                    btn_type: btn_type,
                    editor: editor
                });

                switch (btn_type) {
                case 'bold':
                    editor.execCommand('bold', false, null);
                    break;
                case 'italic':
                    editor.execCommand('italic', false, null);
                    break;
                case 'underline':
                    editor.execCommand('underline', false, null);
                    break;
                default:
                    log("Unknown button type %o pressed!", btn_type);
                }
                return false;
            }

            function on_iframe_loaded() {
                var $body;

                log("IFrame loaded. Turning on design mode.");
                editor = $rte.contents()[0];
                editor.designMode = 'on';
                $body = $(editor).find('body').addClass("r3bb-content");

                // Copy in old text area html
                if (settings.copy_value) {
                    log("Copying HTML from textarea.");
                    $body.html($this.html());
                }

                if (settings.stylesheet) {
                    log("Inserting stylesheet.");
                    $(editor).find("head").append(
                        $('<link rel="stylesheet" type="text/css" media="screen" />').
                            attr('href', settings.stylesheet)
                    );
                }
            }

            // Hide the original textarea.
            $this.hide();

            // Insert the r3bb markup instead.
            $r3bb = $(markup).insertBefore($this);

            // And insert a freshly created iframe inside.
            $rte = $("<iframe class=\"r3bbif\" />").css({
                // Copy text area's original dimensions
                width: twidth,
                height: theight
            }).appendTo($r3bb);

            // Waiting for iframe to load

            // WebKit relies on the ready event, gecko on the load event.
            // Let's hope multiple initializations won't do any harm.
            $rte.load(on_iframe_loaded).contents().eq(0).ready(on_iframe_loaded);

            // Init toolbar buttons
            $r3bb.find("nav button").click(on_button_clicked);

            // Hook submit event, paste iframe content into textarea and convert
            // it from HTML to BBCode
            $this.parents('form:first').submit(function () {
                log("Submit caught. Creating BBCode.");
                $this.val($(editor).find("body").html())
                    .html2bb()
                    .trigger('r3bb-submit');
            });
        });
    };

    $.fn.html2bb = function () {
        // Borrowed from 'wysiwyg-bbcode'. Seems to be quite comprehensive.
        return $(this).each(function () {
            var content = $(this).val(), a, sc2;
            function rep(regex, replacement) {
                content = content.replace(regex, replacement);
            }
            rep(/<img\s[^<>]*?src=\"?([^<>]*?)\"?(\s[^<>]*)?\/?>/gi, "[img]$1[/img]");
            rep(/<\/(strong|b)>/gi, "[/b]");
            rep(/<(strong|b)(\s[^<>]*)?>/gi, "[b]");
            rep(/<\/(em|i)>/gi, "[/i]");
            rep(/<(em|i)(\s[^<>]*)?>/gi, "[i]");
            rep(/<\/u>/gi, "[/u]");
            rep(/\n/gi, "");
            rep(/\r/gi, "");
            rep(/<u(\s[^<>]*)?>/gi, "[u]");
            rep(/<br(\s[^<>]*)?>/gi, "\n");
            rep(/<p(\s[^<>]*)?>/gi, "");
            rep(/<\/p>/gi, "\n");
            rep(/<ul>/gi, "[ul]");
            rep(/<\/ul>/gi, "[/ul]");
            rep(/<li>/gi, "[li]");
            rep(/<\/li>/gi, "[/li]");
            rep(/<div([^<>]*)>/gi, "\n<span$1>");
            rep(/<\/div>/gi, "</span>\n");
            rep(/&nbsp;/gi, " ");
            rep(/&quot;/gi, "\"");
            rep(/&amp;/gi, "&");
            do {
                a = content;
                rep(/<font\s[^<>]*?color=\"?([^<>]*?)\"?(\s[^<>]*)?>([^<>]*?)<\/font>/gi, "[color=$1]$3[/color]");
                if (a === content) {
                    rep(/<font[^<>]*>([^<>]*?)<\/font>/gi, "$1");
                }
                rep(/<a\s[^<>]*?href=\"?([^<>]*?)\"?(\s[^<>]*)?>([^<>]*?)<\/a>/gi, "[url=$1]$3[/url]");
                sc2 = content;
                rep(/<(span|blockquote|pre)\s[^<>]*?style=\"?font-weight: ?bold;?\"?\s*([^<]*?)<\/\1>/gi, "[b]<$1 style=$2</$1>[/b]");
                rep(/<(span|blockquote|pre)\s[^<>]*?style=\"?font-weight: ?normal;?\"?\s*([^<]*?)<\/\1>/gi, "<$1 style=$2</$1>");
                rep(/<(span|blockquote|pre)\s[^<>]*?style=\"?font-style: ?italic;?\"?\s*([^<]*?)<\/\1>/gi, "[i]<$1 style=$2</$1>[/i]");
                rep(/<(span|blockquote|pre)\s[^<>]*?style=\"?font-style: ?normal;?\"?\s*([^<]*?)<\/\1>/gi, "<$1 style=$2</$1>");
                rep(/<(span|blockquote|pre)\s[^<>]*?style=\"?text-decoration: ?underline;?\"?\s*([^<]*?)<\/\1>/gi, "[u]<$1 style=$2</$1>[/u]");
                rep(/<(span|blockquote|pre)\s[^<>]*?style=\"?text-decoration: ?none;?\"?\s*([^<]*?)<\/\1>/gi, "<$1 style=$2</$1>");
                rep(/<(span|blockquote|pre)\s[^<>]*?style=\"?color: ?([^<>]*?);\"?\s*([^<]*?)<\/\1>/gi, "[color=$2]<$1 style=$3</$1>[/color]");
                rep(/<(blockquote|pre)\s[^<>]*?style=\"?\"? (class=|id=)([^<>]*)>([^<>]*?)<\/\1>/gi, "<$1 $2$3>$4</$1>");
                rep(/<span\s[^<>]*?style=\"?\"?>([^<>]*?)<\/span>/gi, "$1");
                if (sc2 === content) {
                    rep(/<span[^<>]*>([^<>]*?)<\/span>/gi, "$1");
                    sc2 = content;
                    rep(/<pre\s[^<>]*?class=\"?code\"?[^<>]*?>([^<>]*?)<\/pre>/gi, "[code]$1[/code]");
                    if (sc2 === content) {
                        rep(/<blockquote\s[^<>]*?class=\"?memberquote\"?[^<>]*?id=\"?([^<>\"]*)\"?>([^<>]*?)<\/blockquote>/gi, "[quote$1]$2[/quote]");
                        if (sc2 === content) {
                            rep(/<blockquote\s[^<>]*?id=\"?([^<>\"]*?)\"? class=\"?memberquote\"?[^<>]*?>([^<>]*?)<\/blockquote>/gi, "[quote$1]$2[/quote]");
                            if (sc2 === content) {
                                rep(/<blockquote\s[^<>]*?class=\"?memberquote\"?[^<>]*?>([^<>]*?)<\/blockquote>/gi, "[quote]$1[/quote]");
                            }
                        }
                    }
                }
            } while (a !== content);
            rep(/<[^<>]*>/gi, "");
            rep(/&lt;/gi, "<");
            rep(/&gt;/gi, ">");
            do {
                a = content;
                rep(/\[(b|i|u)\]\[quote([^\]]*)\]([\s\S]*?)\[\/quote\]\[\/\1\]/gi, "[quote$2][$1]$3[/$1][/quote]");
                rep(/\[color=([^\]]*)\]\[quote([^\]]*)\]([\s\S]*?)\[\/quote\]\[\/color\]/gi, "[quote$2][color=$1]$3[/color][/quote]");
                rep(/\[(b|i|u)\]\[code\]([\s\S]*?)\[\/code\]\[\/\1\]/gi, "[code][$1]$2[/$1][/code]");
                rep(/\[color=([^\]]*)\]\[code\]([\s\S]*?)\[\/code\]\[\/color\]/gi, "[code][color=$1]$2[/color][/code]");
            } while (a !== content);
            do {
                a = content;
                rep(/\[b\]\[\/b\]/gi, "");
                rep(/\[i\]\[\/i\]/gi, "");
                rep(/\[u\]\[\/u\]/gi, "");
                rep(/\[quote[^\]]*\]\[\/quote\]/gi, "");
                rep(/\[code\]\[\/code\]/gi, "");
                rep(/\[url=([^\]]+)\]\[\/url\]/gi, "");
                rep(/\[img\]\[\/img\]/gi, "");
                rep(/\[color=([^\]]*)\]\[\/color\]/gi, "");
            } while (a !== content);
            $(this).val(content);
        });
    };
}(jQuery));

