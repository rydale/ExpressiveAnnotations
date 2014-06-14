﻿///<reference path="./expressive.annotations.analysis.js"/>

(function(wnd, analyser) { //scoping function (top-level, usually anonymous, function that prevents global namespace pollution)

    wnd.module("logical expressions analysis");
    //debugger; //enable firebug for all web pages

    test("Verify_tokenizer_logic", function() {
        var expression = "( true && (true) ) || false";
        var tokenizer = new analyser.Tokenizer(['true', 'false', '&&', '\\|\\|', '\\!', '\\(', '\\)']);

        var tokens = tokenizer.analyze(expression);
        wnd.equal(tokens.length, 9);
        wnd.equal(tokens[0], "(");
        wnd.equal(tokens[1], "true");
        wnd.equal(tokens[2], "&&");
        wnd.equal(tokens[3], "(");
        wnd.equal(tokens[4], "true");
        wnd.equal(tokens[5], ")");
        wnd.equal(tokens[6], ")");
        wnd.equal(tokens[7], "||");
        wnd.equal(tokens[8], "false");

        wnd.raises(function() {
            tokenizer.analyze("true + false");
        }, function(err) {
            return err === "Tokenizer error. Unexpected token started at + false.";
        });
        wnd.raises(function() {
            tokenizer.analyze("true && 7");
        }, function(err) {
            return err === "Tokenizer error. Unexpected token started at 7.";
        });
    });

    test("Verify_infix_to_postfix_conversion", function() {
        var converter = new analyser.InfixParser();

        wnd.equal(converter.convert("()"), "");
        wnd.equal(converter.convert("( true && (true) ) || false"), "true true && false ||");
        wnd.equal(converter.convert(
                "(true || ((true || (false || true)))) || (true && true && false || (false || true && (true && true || ((false))))) && false"),
                "true true false true || || || true true false false true true true false || && && || || && && false && ||");
        wnd.equal(converter.convert("!!((!(!!true))) && true"), "true ! ! ! ! ! true &&");

        wnd.raises(function() {
            converter.convert("(");
        }, function(err) {
            return err === "Infix expression parsing error. Incorrect nesting.";
        });
        wnd.raises(function() {
            converter.convert(")");
        }, function(err) {
            return err === "Infix expression parsing error. Incorrect nesting.";
        });
        wnd.raises(function() {
            converter.convert("(( true )");
        }, function(err) {
            return err === "Infix expression parsing error. Incorrect nesting.";
        });
        wnd.raises(function() {
            converter.convert("( true && false ))");
        }, function(err) {
            return err === "Infix expression parsing error. Incorrect nesting.";
        });
    });

    test("Verify_postfix_parser", function() {
        var parser = new analyser.PostfixParser();

        wnd.ok(parser.evaluate("true"));
        wnd.ok(!parser.evaluate("false"));

        wnd.ok(parser.evaluate("true true &&"));
        wnd.ok(!parser.evaluate("true false &&"));
        wnd.ok(!parser.evaluate("false true &&"));
        wnd.ok(!parser.evaluate("false false &&"));

        wnd.ok(parser.evaluate("true true ||"));
        wnd.ok(parser.evaluate("true false ||"));
        wnd.ok(parser.evaluate("false true ||"));
        wnd.ok(!parser.evaluate("false false ||"));

        wnd.ok(parser.evaluate("true true false true || || || true true false false true true true false || && && || || && && false && ||"));

        wnd.raises(function() {
            parser.evaluate("(true)");
        }, function(err) {
            return err === "Tokenizer error. Unexpected token started at (true).";
        });
        wnd.raises(function () {
            parser.evaluate(" ");
        }, function (err) {
            return err === "Stack empty.";
        });
        wnd.raises(function () {
            parser.evaluate("");
        }, function (err) {
            return err === "Stack empty.";
        });
        wnd.raises(function () {
            parser.evaluate(null);
        }, function (err) {
            return err === "Stack empty.";
        });
    });

    test("Verify_complex_expression_evaluation", function() {
        var evaluator = new analyser.Evaluator();

        wnd.ok(evaluator.compute("(true || ((true || (false || true)))) || (true && true && false || (false || true && (true && true || ((false))))) && false"));
        wnd.ok(evaluator.compute("( !!((!(!!!true || !!false || !true))) && true && !(true && false) ) && (!((!(!true))) || !!!(((!true))))"));

        wnd.raises(function () {
            evaluator.compute(" ");
        }, function (err) {
            return err === "Logical expression computation failed. Expression is broken.";
        });
        wnd.raises(function () {
            evaluator.compute("");
        }, function (err) {
            return err === "Logical expression computation failed. Expression is broken.";
        });
        wnd.raises(function () {
            evaluator.compute(null);
        }, function (err) {
            return err === "Logical expression computation failed. Expression is broken.";
        });
    });

    test("Verify_comparison_options", function () {
        var comparer = new analyser.Comparer();

        wnd.ok(comparer.compute("aAa", "aAa", "==", true));
        wnd.ok(!comparer.compute("aAa", "aaa", "==", true));

        wnd.ok(!comparer.compute("aAa", "aAa", "!=", true));
        wnd.ok(comparer.compute("aAa", "aaa", "!=", true));

        wnd.ok(comparer.compute("aAa", "aAa", "==", false));
        wnd.ok(comparer.compute("aAa", "aaa", "==", false));

        wnd.ok(!comparer.compute("aAa", "aAa", "!=", false));
        wnd.ok(!comparer.compute("aAa", "aaa", "!=", false));
    });

    test("Verify_comparison_equals_non_empty", function() {
        var comparer = new analyser.Comparer();

        wnd.ok(comparer.compute("aAa", "aAa", "==", true));
        wnd.ok(comparer.compute(0, 0, "==", true));
        wnd.ok(comparer.compute(new Date("Wed, 09 Aug 1995 00:00:00 GMT"), new Date("Wed, 09 Aug 1995 00:00:00 GMT"), "==", true));
        wnd.ok(comparer.compute({}, {}, "==", true));
        wnd.ok(comparer.compute({ error: true }, { error: true }, "==", true));
        wnd.ok(comparer.compute(["a", "b"], ["a", "b"], "==", true));

        wnd.ok(!comparer.compute("aAa", "aAa ", "==", true));
        wnd.ok(!comparer.compute("aAa", " aAa", "==", true));
        wnd.ok(!comparer.compute("aAa", "aaa", "==", true));
        wnd.ok(!comparer.compute(0, 1, "==", true));
        wnd.ok(!comparer.compute(new Date("Wed, 09 Aug 1995 00:00:00 GMT"), new Date("Wed, 09 Aug 1995 00:00:01 GMT"), "==", true));
        wnd.ok(!comparer.compute({ error: true }, { error: false }, "==", true));
        wnd.ok(!comparer.compute(["a", "b"], ["a", "B"], "==", true));
    });

    test("Verify_comparison_equals_empty", function() {
        var comparer = new analyser.Comparer();

        wnd.ok(comparer.compute("", "", "==", true));
        wnd.ok(comparer.compute(" ", " ", "==", true));
        wnd.ok(comparer.compute("\t", "\n", "==", true));
        wnd.ok(comparer.compute(null, null, "==", true));
        wnd.ok(comparer.compute("", " ", "==", true));
        wnd.ok(comparer.compute("\n\t ", null, "==", true));
        wnd.ok(comparer.compute(null, undefined, "==", true));
    });

    test("Verify_comparison_greater_and_less", function() {
        var comparer = new analyser.Comparer();

        // assumption - arguments provided have exact types

        wnd.ok(comparer.compute("a", "A", ">", true));
        wnd.ok(comparer.compute("a", "A", ">=", true));
        wnd.ok(comparer.compute("abcd", "ABCD", ">", true));
        wnd.ok(comparer.compute("abcd", "ABCD", ">=", true));
        wnd.ok(comparer.compute(1, 0, ">", true));
        wnd.ok(comparer.compute(1, 0, ">=", true));
        wnd.ok(comparer.compute(0, -1, ">", true));
        wnd.ok(comparer.compute(0, -1, ">=", true));
        wnd.ok(comparer.compute(1.1, 1.01, ">", true));
        wnd.ok(comparer.compute(1.1, 1.01, ">=", true));
        wnd.ok(comparer.compute(new Date("Wed, 09 Aug 1995 00:00:01 GMT"), new Date("Wed, 09 Aug 1995 00:00:00 GMT"), ">", true));
        wnd.ok(comparer.compute(new Date("Wed, 09 Aug 1995 00:00:01 GMT"), new Date("Wed, 09 Aug 1995 00:00:00 GMT"), ">=", true));

        wnd.ok(!comparer.compute("a", null, ">", true));
        wnd.ok(!comparer.compute("a", null, ">=", true));
        wnd.ok(!comparer.compute(null, "a", ">", true));
        wnd.ok(!comparer.compute(null, "a", ">=", true));

        wnd.ok(!comparer.compute("a", "A", "<", true));
        wnd.ok(!comparer.compute("a", "A", "<=", true));
        wnd.ok(!comparer.compute("abcd", "ABCD", "<", true));
        wnd.ok(!comparer.compute("abcd", "ABCD", "<=", true));
        wnd.ok(!comparer.compute(1, 0, "<", true));
        wnd.ok(!comparer.compute(1, 0, "<="));
        wnd.ok(!comparer.compute(0, -1, "<", true));
        wnd.ok(!comparer.compute(0, -1, "<=", true));
        wnd.ok(!comparer.compute(1.1, 1.01, "<", true));
        wnd.ok(!comparer.compute(1.1, 1.01, "<=", true));
        wnd.ok(!comparer.compute(new Date("Wed, 09 Aug 1995 00:00:01 GMT"), new Date("Wed, 09 Aug 1995 00:00:00 GMT"), "<", true));
        wnd.ok(!comparer.compute(new Date("Wed, 09 Aug 1995 00:00:01 GMT"), new Date("Wed, 09 Aug 1995 00:00:00 GMT"), "<=", true));

        wnd.ok(!comparer.compute("a", null, "<", true));
        wnd.ok(!comparer.compute("a", null, "<=", true));
        wnd.ok(!comparer.compute(null, "a", "<", true));
        wnd.ok(!comparer.compute(null, "a", "<=", true));


        wnd.raises(function() {
            comparer.compute({}, {}, ">", true);
        }, function(err) {
            return err === "Greater than and less than relational operations not allowed for arguments of types other than: numeric, string or datetime.";
        });
    });

    wnd.module("type helpers");

    test("Verify_typehelper_array_contains", function () {
        wnd.ok(analyser.typeHelper.Array.contains(["a"], "a"));
        wnd.ok(analyser.typeHelper.Array.contains(["a", "b"], "a"));
        wnd.ok(analyser.typeHelper.Array.contains(["a", "b"], "b"));
        wnd.ok(!analyser.typeHelper.Array.contains(["a", "b"], "c"));
    });

    test("Verify_typehelper_array_sanatize", function () {
        var array = ["a"];
        analyser.typeHelper.Array.sanatize(["a"], "");
        wnd.deepEqual(["a"], array);

        array = ["a", "a"];
        analyser.typeHelper.Array.sanatize(array, "a");
        wnd.deepEqual([], array);

        array = ["a", "b"];
        analyser.typeHelper.Array.sanatize(array, "");
        wnd.deepEqual(["a", "b"], array);

        array = ["a", "b", "c", "a", "b"];
        analyser.typeHelper.Array.sanatize(array, "b");
        wnd.deepEqual(["a", "c", "a"], array);
    });

    test("Verify_typehelper_string_format", function () {
        wnd.equal(analyser.typeHelper.String.format("{0}", "a"), "a");
        wnd.equal(analyser.typeHelper.String.format("{0}{1}", "a", "b"), "ab");
        wnd.equal(analyser.typeHelper.String.format("{0}{0}", "a", "b"), "aa");
        wnd.equal(analyser.typeHelper.String.format("{0}{0}", "a"), "aa");

        wnd.equal(analyser.typeHelper.String.format("{0}", ["a"]), "a");
        wnd.equal(analyser.typeHelper.String.format("{0}{1}", ["a", "b"]), "ab");
        wnd.equal(analyser.typeHelper.String.format("{0}{0}", ["a", "b"]), "aa");
        wnd.equal(analyser.typeHelper.String.format("{0}{0}", ["a"]), "aa");
    });

    test("Verify_typehelper_bool_tryparse", function () {
        wnd.equal(analyser.typeHelper.Bool.tryParse(false), false);
        wnd.equal(analyser.typeHelper.Bool.tryParse("false"), false);
        wnd.equal(analyser.typeHelper.Bool.tryParse("False"), false);
        wnd.equal(analyser.typeHelper.Bool.tryParse(true), true);
        wnd.equal(analyser.typeHelper.Bool.tryParse("true"), true);
        wnd.equal(analyser.typeHelper.Bool.tryParse("True"), true);
        
        var result = analyser.typeHelper.Bool.tryParse("asd");
        wnd.equal(result.error, true);
        wnd.equal(result.msg, "Parsing error. Given value has no boolean meaning.");
    });

    test("Verify_typehelper_float_tryparse", function () {
        // integer literals
        wnd.equal(analyser.typeHelper.Float.tryParse("-1"), -1); // negative integer string
        wnd.equal(analyser.typeHelper.Float.tryParse("0"), 0); // zero string
        wnd.equal(analyser.typeHelper.Float.tryParse("1"), 1); // positive integer string
        wnd.equal(analyser.typeHelper.Float.tryParse(-1), -1); // negative integer number
        wnd.equal(analyser.typeHelper.Float.tryParse(0), 0); // zero integer number
        wnd.equal(analyser.typeHelper.Float.tryParse(1), 1); // positive integer number
        wnd.equal(analyser.typeHelper.Float.tryParse(0xFF), 255); // hexadecimal integer literal

        // floating-point literals
        wnd.equal(analyser.typeHelper.Float.tryParse("-1.1"), -1.1); // negative floating point string
        wnd.equal(analyser.typeHelper.Float.tryParse("1.1"), 1.1); // positive floating point string
        wnd.equal(analyser.typeHelper.Float.tryParse(-1.1), -1.1); // negative floating point number
        wnd.equal(analyser.typeHelper.Float.tryParse(1.1), 1.1); // positive floating point number
        wnd.equal(analyser.typeHelper.Float.tryParse("314e-2"), 3.14); // exponential notation string 
        wnd.equal(analyser.typeHelper.Float.tryParse(314e-2), 3.14); // exponential notation

        // non-numeric valuer
        var result = analyser.typeHelper.Float.tryParse(""); // empty string
        wnd.equal(result.error, true);
        wnd.equal(result.msg, "Parsing error. Given value has no numeric meaning.");

        wnd.ok(analyser.typeHelper.Float.tryParse(" ").error); // whitespace character
        wnd.ok(analyser.typeHelper.Float.tryParse("\t").error); // tab characters
        wnd.ok(analyser.typeHelper.Float.tryParse("asd").error); // non-numeric character string
        wnd.ok(analyser.typeHelper.Float.tryParse("true").error); // boolean true
        wnd.ok(analyser.typeHelper.Float.tryParse("false").error); // boolean false
        wnd.ok(analyser.typeHelper.Float.tryParse("asd123").error); // number with preceding non-numeric characters
        wnd.ok(analyser.typeHelper.Float.tryParse("123asd").error); // number with trailling non-numeric characters
        wnd.ok(analyser.typeHelper.Float.tryParse(undefined).error); // undefined value
        wnd.ok(analyser.typeHelper.Float.tryParse(null).error); // null value
        wnd.ok(analyser.typeHelper.Float.tryParse(NaN).error); // NaN value
        wnd.ok(analyser.typeHelper.Float.tryParse(Infinity).error); // infinity primitive
        wnd.ok(analyser.typeHelper.Float.tryParse(+Infinity).error); // positive Infinity
        wnd.ok(analyser.typeHelper.Float.tryParse(-Infinity).error); // negative Infinity
        wnd.ok(analyser.typeHelper.Float.tryParse(new Date(Date.now())).error); // date object
        wnd.ok(analyser.typeHelper.Float.tryParse({}).error); // empty object
    });

    test("Verify_typehelper_date_tryparse", function () {
        var now = Date.now();
        wnd.deepEqual(analyser.typeHelper.Date.tryParse(new Date(now)), new Date(now));
        wnd.deepEqual(analyser.typeHelper.Date.tryParse("Wed, 09 Aug 1995 00:00:00 GMT"), new Date(807926400000));
        wnd.deepEqual(analyser.typeHelper.Date.tryParse("Thu, 01 Jan 1970 00:00:00 GMT"), new Date(0));
        wnd.deepEqual(analyser.typeHelper.Date.tryParse("Thu, 01 Jan 1970 00:00:00 GMT-0400"), new Date(14400000));

        var result = analyser.typeHelper.Date.tryParse("");
        wnd.equal(result.error, true);
        wnd.equal(result.msg, "Parsing error. Given value is not a string representing an RFC 2822 or ISO 8601 date.");
    });

    test("Verify_typehelper_is_empty", function () {
        wnd.ok(analyser.typeHelper.isEmpty(null));
        wnd.ok(analyser.typeHelper.isEmpty(undefined));
        wnd.ok(analyser.typeHelper.isEmpty(""));
        wnd.ok(analyser.typeHelper.isEmpty(" "));
        wnd.ok(analyser.typeHelper.isEmpty("\t"));
        wnd.ok(analyser.typeHelper.isEmpty("\n"));
        wnd.ok(analyser.typeHelper.isEmpty("\n\t "));
    });

    test("Verify_typehelper_is_numeric", function () {
        wnd.ok(analyser.typeHelper.isNumeric(1));
        wnd.ok(!analyser.typeHelper.isNumeric(NaN));
        wnd.ok(!analyser.typeHelper.isNumeric("1"));
    });

    test("Verify_typehelper_is_date", function () {
        wnd.ok(analyser.typeHelper.isDate(new Date("Wed, 09 Aug 1995 00:00:00 GMT")));
        wnd.ok(!analyser.typeHelper.isDate("Wed, 09 Aug 1995 00:00:00 GMT"));
        wnd.ok(!analyser.typeHelper.isDate(807926400000));
    });

    test("Verify_typehelper_is_string", function () {
        wnd.ok(analyser.typeHelper.isString(""));
        wnd.ok(analyser.typeHelper.isString("123"));
        wnd.ok(!analyser.typeHelper.isString(123));
        wnd.ok(!analyser.typeHelper.isString({}));
        wnd.ok(!analyser.typeHelper.isString(null));
        wnd.ok(!analyser.typeHelper.isString(undefined));
    });

    test("Verify_typehelper_is_bool", function () {
        wnd.ok(analyser.typeHelper.isBool(true));
        wnd.ok(!analyser.typeHelper.isBool("true"));
        wnd.ok(!analyser.typeHelper.isBool(0));
    });

}(window, logicalExpressionsAnalyser));