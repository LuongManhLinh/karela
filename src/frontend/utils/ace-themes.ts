
export const defineCustomThemes = () => {
  if (typeof window === 'undefined') return;
  const ace = require("ace-builds/src-noconflict/ace");

  // Jira Theme (Light/Blue-ish)
  ace.define("ace/theme/jira", ["require", "exports", "module", "ace/lib/dom"], function(require: any, exports: any, module: any) {
    exports.isDark = false;
    exports.cssClass = "ace-jira";
    exports.cssText = `
        .ace-jira .ace_gutter { background: #f4f5f7; color: #5e6c84 }
        .ace-jira .ace_print-margin { width: 1px; background: #e8e8e8 }
        .ace-jira { background-color: #ffffff; color: #172b4d }
        .ace-jira .ace_cursor { color: #0052cc }
        .ace-jira .ace_marker-layer .ace_selection { background: #b3d4ff }
        .ace-jira .ace_multiselect .ace_selection.ace_start { box-shadow: 0 0 3px 0px white; }
        .ace-jira .ace_marker-layer .ace_step { background: rgb(255, 255, 0) }
        .ace-jira .ace_marker-layer .ace_bracket { margin: -1px 0 0 -1px; border: 1px solid #c1c7d0 }
        .ace-jira .ace_marker-layer .ace_active-line { background: #f4f5f7 }
        .ace-jira .ace_gutter-active-line { background-color: #ebecf0 }
        .ace-jira .ace_marker-layer .ace_selected-word { border: 1px solid #b3d4ff }
        .ace-jira .ace_fold { background-color: #6b778c; border-color: #172b4d }
        .ace-jira .ace_keyword { color: #0052cc; font-weight: bold; }
        .ace-jira .ace_constant.ace_language { color: #0052cc; font-weight: bold; }
        .ace-jira .ace_string { color: #36b37e }
        .ace-jira .ace_variable.ace_parameter { color: #ff5630 }
        .ace-jira .ace_comment { color: #6b778c; font-style: italic }
        .ace-jira .ace_tag { color: #6554c0 }
    `;
    const dom = require("ace/lib/dom");
    dom.importCssString(exports.cssText, exports.cssClass);
  });

  // Cucumber Theme (Dark/Green-ish)
  ace.define("ace/theme/cucumber", ["require", "exports", "module", "ace/lib/dom"], function(require: any, exports: any, module: any) {
    exports.isDark = true;
    exports.cssClass = "ace-cucumber";
    exports.cssText = `
        .ace-cucumber .ace_gutter { background: #232d29; color: #8a9691 }
        .ace-cucumber .ace_print-margin { width: 1px; background: #333333 }
        .ace-cucumber { background-color: #1d2622; color: #e6e6e6 }
        .ace-cucumber .ace_cursor { color: #00ffaa }
        .ace-cucumber .ace_marker-layer .ace_selection { background: #2d4f3e }
        .ace-cucumber .ace_multiselect .ace_selection.ace_start { box-shadow: 0 0 3px 0px #1d2622; }
        .ace-cucumber .ace_marker-layer .ace_step { background: rgb(102, 82, 0) }
        .ace-cucumber .ace_marker-layer .ace_bracket { margin: -1px 0 0 -1px; border: 1px solid #4d5953 }
        .ace-cucumber .ace_marker-layer .ace_active-line { background: #232d29 }
        .ace-cucumber .ace_gutter-active-line { background-color: #232d29 }
        .ace-cucumber .ace_marker-layer .ace_selected-word { border: 1px solid #2d4f3e }
        .ace-cucumber .ace_fold { background-color: #00ffaa; border-color: #e6e6e6 }
        .ace-cucumber .ace_keyword { color: #00ffaa; font-weight: bold; }
        .ace-cucumber .ace_constant.ace_language { color: #00ffaa; font-weight: bold; }
        .ace-cucumber .ace_string { color: #a3ffcc }
        .ace-cucumber .ace_variable.ace_parameter { color: #ffcc66 }
        .ace-cucumber .ace_comment { color: #5c6e66; font-style: italic }
        .ace-cucumber .ace_tag { color: #9966ff }
    `;
    const dom = require("ace/lib/dom");
    dom.importCssString(exports.cssText, exports.cssClass);
  });
};
