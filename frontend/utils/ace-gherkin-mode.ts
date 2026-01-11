import "ace-builds/src-noconflict/ace";

export const defineGherkinMode = () => {
  const ace = require("ace-builds/src-noconflict/ace");

  ace.define("ace/mode/gherkin_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function(require: any, exports: any, module: any) {
    const oop = require("ace/lib/oop");
    const TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

    const GherkinHighlightRules = function(this: any) {
      const keywords = "Feature|Background|Scenario|Scenario Outline|Examples|Given|When|Then|And|But|Rule|Example";
      
      this.$rules = {
        "start": [
          {
            token: "constant.language",
            regex: "\\b(" + keywords + ")\\b"
          },
          {
            token: "string", // " string
            regex: '".*?"'
          },
          {
            token: "string", // ' string
            regex: "'.*?'"
          },
          {
            token: "variable.parameter", // <param>
            regex: "<[^>]+>"
          },
          {
            token: "comment",
            regex: "#.*$"
          },
          {
            token: "keyword", // tags
            regex: "@\\w+"
          },
          {
             token: "text",
             regex: "\\s+"
          }
        ]
      };
    };

    oop.inherits(GherkinHighlightRules, TextHighlightRules);
    exports.GherkinHighlightRules = GherkinHighlightRules;
  });

  ace.define("ace/mode/gherkin", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/gherkin_highlight_rules"], function(require: any, exports: any, module: any) {
    const oop = require("ace/lib/oop");
    const TextMode = require("ace/mode/text").Mode;
    const GherkinHighlightRules = require("ace/mode/gherkin_highlight_rules").GherkinHighlightRules;

    const Mode = function(this: any) {
      this.HighlightRules = GherkinHighlightRules;
    };
    oop.inherits(Mode, TextMode);
    exports.Mode = Mode;
  });
};
