package io.ratsnake.integrations.jira.jql;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Fluent JQL builder focused on safety:
 * - Strongly-typed enums for common fields, issue types, statuses
 * - Safe quoting of literals
 * - IN / NOT IN, IS (NOT) EMPTY, text ~ contains, comparisons, grouping (...)
 * - Multiple ORDER BY fields
 * <p>
 * Usage:
 *   String jql = Jql.start()
 *       .project("RAT")
 *       .and()
 *       .issuetypeIn(IssueType.STORY, IssueType.TASK)
 *       .and()
 *       .statusIn(Status.TO_DO, Status.IN_PROGRESS)
 *       .orderBy(Field.CREATED, Direction.DESC)
 *       .orderBy(Field.PRIORITY, Direction.DESC)
 *       .build();
 */
public final class Jql {
    private final StringBuilder sb = new StringBuilder();
    private final List<String> orderBy = new ArrayList<>();

    private Jql() { }

    public static Jql builder() { return new Jql(); }

    // ---------- Common convenience clauses ----------
    public Jql project(String key) {
        clause(FieldName.PROJECT.text(), "=", literal(key));
        return this;
    }

    public Jql issuetypeIn(IssueTypeName... types) {
        String list = listOf(Arrays.stream(types).map(IssueTypeName::text).collect(Collectors.toList()));
        clause(FieldName.ISSUE_TYPE.text(), "in", list);
        return this;
    }

    public Jql statusIn(Status... statuses) {
        String list = listOf(Arrays.stream(statuses).map(Status::text).collect(Collectors.toList()));
        clause(FieldName.STATUS.text(), "in", list);
        return this;
    }

    public Jql assigneeEquals(String accountOrName) {
        clause(FieldName.ASSIGNEE.text(), "=", literal(accountOrName));
        return this;
    }

    public Jql labelsIn(String... labels) {
        clause(FieldName.LABELS.text(), "in", listOf(Arrays.asList(labels)));
        return this;
    }

    public Jql summaryContains(String text) {
        clause(FieldName.SUMMARY.text(), "~", literal(text));
        return this;
    }

    public Jql descriptionContains(String text) {
        clause(FieldName.DESCRIPTION.text(), "~", literal(text));
        return this;
    }

    // ---------- Generic field operations ----------
    public Jql fieldEq(FieldName field, String value) {
        clause(field.text(), "=", literal(value));
        return this;
    }
    public Jql fieldNe(FieldName field, String value) {
        clause(field.text(), "!=", literal(value));
        return this;
    }
    public Jql fieldIn(FieldName field, Collection<String> values) {
        clause(field.text(), "in", listOf(values));
        return this;
    }
    public Jql fieldNotIn(FieldName field, Collection<String> values) {
        clause(field.text(), "not in", listOf(values));
        return this;
    }
    public Jql fieldGt(FieldName field, String value) {
        clause(field.text(), ">", literal(value));
        return this;
    }
    public Jql fieldGte(FieldName field, String value) {
        clause(field.text(), ">=", literal(value));
        return this;
    }
    public Jql fieldLt(FieldName field, String value) {
        clause(field.text(), "<", literal(value));
        return this;
    }
    public Jql fieldLte(FieldName field, String value) {
        clause(field.text(), "<=", literal(value));
        return this;
    }
    public Jql fieldContains(FieldName field, String value) {
        clause(field.text(), "~", literal(value));
        return this;
    }
    public Jql isEmpty(FieldName field) {
        clause(field.text(), "is", "EMPTY");
        return this;
    }
    public Jql isNotEmpty(FieldName field) {
        clause(field.text(), "is", "NOT EMPTY");
        return this;
    }

    // Custom field by ID, e.g., "customfield_10016" for Story Points
    public Jql customFieldEq(String customFieldId, String value) {
        clause(customFieldId, "=", literal(value));
        return this;
    }
    public Jql customFieldIn(String customFieldId, Collection<String> values) {
        clause(customFieldId, "in", listOf(values));
        return this;
    }

    // ---------- Boolean & grouping ----------
    public Jql and() { sb.append(" AND "); return this; }
    public Jql or()  { sb.append(" OR ");  return this; }

    /** Start a (...) group */
    public JqlGroup group() { return new JqlGroup(this); }

    // ---------- ORDER BY ----------
    public Jql orderBy(FieldName field, Order dir) {
        orderBy.add(field.text() + " " + dir.name());
        return this;
    }
    public Jql orderByCustom(String rawField, Order dir) {
        orderBy.add(rawField + " " + dir.name());
        return this;
    }

    // ---------- Build ----------
    public String build() {
        String core = sb.toString().trim();
        if (!orderBy.isEmpty()) {
            core += " ORDER BY " + String.join(", ", orderBy);
        }
        return core;
    }

    // ===== Helpers =====
    private void clause(String left, String op, String right) {
        if (needsSpaceBefore()) sb.append(' ');
        sb.append(left).append(' ').append(op).append(' ').append(right);
    }

    private boolean needsSpaceBefore() {
        if (sb.isEmpty()) return false;
        char c = sb.charAt(sb.length() - 1);
        // If we just opened a group "(", don't insert an extra space.
        return c != '(' && c != ' ';
    }

    private static boolean looksLikeJqlFunction(String s) {
        // e.g., now(), startOfDay(-7d), endOfDay(), startOfWeek(2w)
        return s != null && s.matches("[A-Za-z][A-Za-z0-9_]*\\s*\\(.*\\)");
    }

    private static boolean isNumeric(String s) {
        return s != null && s.matches("\\d+");
    }

    /** Quote everything except JQL functions and pure numbers. */
    private static String literal(String s) {
        if (s == null || s.isBlank()) return "''";
        if (looksLikeJqlFunction(s)) return s; // keep functions unquoted
        if (isNumeric(s)) return s;            // 123
        // otherwise, single-quote and escape single quotes
        return "'" + s.replace("'", "\\'") + "'";
    }



    /** Render JQL list: ('A', 'B', 'C') with safe quoting. */
    private static String listOf(Collection<String> values) {
        if (values == null || values.isEmpty()) return "()";
        String joined = values.stream()
                .map(Jql::literal)
                .collect(Collectors.joining(", "));
        return "(" + joined + ")";
    }

    // ===== Group builder =====
    public static final class JqlGroup {
        private final Jql parent;
        private final StringBuilder gb = new StringBuilder();

        private JqlGroup(Jql parent) {
            this.parent = parent;
            parent.sb.append('('); // open in parent stream
        }

        public JqlGroup project(String key) {
            clause(FieldName.PROJECT.text(), "=", literal(key)); return this;
        }
        public JqlGroup issuetypeIn(IssueTypeName... types) {
            String list = listOf(Arrays.stream(types).map(IssueTypeName::text).collect(Collectors.toList()));
            clause(FieldName.ISSUE_TYPE.text(), "in", list); return this;
        }
        public JqlGroup statusIn(Status... statuses) {
            String list = listOf(Arrays.stream(statuses).map(Status::text).collect(Collectors.toList()));
            clause(FieldName.STATUS.text(), "in", list); return this;
        }
        public JqlGroup fieldEq(FieldName field, String value) {
            clause(field.text(), "=", literal(value)); return this;
        }
        public JqlGroup fieldContains(FieldName field, String value) {
            clause(field.text(), "~", literal(value)); return this;
        }
        public JqlGroup and() { parent.sb.append(" AND "); return this; }
        public JqlGroup or()  { parent.sb.append(" OR ");  return this; }

        /** Close the group: append ")" to parent and return it. */
        public Jql end() {
            parent.sb.append(')');
            return parent;
        }

        private void clause(String left, String op, String right) {
            if (needsSpaceBefore()) parent.sb.append(' ');
            parent.sb.append(left).append(' ').append(op).append(' ').append(right);
        }

        private boolean needsSpaceBefore() {
            if (parent.sb.isEmpty()) return false;
            char c = parent.sb.charAt(parent.sb.length() - 1);
            return c != '(' && c != ' ';
        }

        public JqlGroup summaryContains(String text) {
            clause(FieldName.SUMMARY.text(), "~", literal(text));
            return this;
        }

        public JqlGroup descriptionContains(String text) {
            clause(FieldName.DESCRIPTION.text(), "~", literal(text));
            return this;
        }

    }

    // ===== Date helpers (produce JQL function strings you can pass as values) =====
    public static final class Fn {
        private Fn() {}
        /** startOfDay(), startOfDay(-7d), endOfDay(), startOfWeek(), etc. */
        public static String startOfDay()      { return "startOfDay()"; }
        public static String startOfDay(String offset) { return "startOfDay(" + offset + ")"; }
        public static String endOfDay()        { return "endOfDay()"; }
        public static String startOfWeek()     { return "startOfWeek()"; }
        public static String startOfWeek(String offset) { return "startOfWeek(" + offset + ")"; }
        public static String now()             { return "now()"; }
    }

    public static void main(String[] args) {
        System.out.println(Jql.literal("login"));
//        // 1) Stories & tasks in project RAT, newest first
//        String jql1 = Jql.start()
//                .project("RAT")
//                .and()
//                .issuetypeIn(Jql.IssueType.STORY, Jql.IssueType.TASK)
//                .orderBy(Jql.Field.CREATED, Jql.Direction.DESC)
//                .build();
//// project = RAT AND issuetype in ('Story','Task') ORDER BY created DESC
//
//    // 2) Issues assigned to alice, not Done, created in the last 7 days
//            String jql2 = Jql.start()
//                    .assigneeEquals("alice@example.com")
//                        .and()
//                        .fieldNe(Jql.Field.STATUS, Jql.Status.DONE.text())
//                        .and()
//                        .fieldGte(Jql.Field.CREATED, Jql.Fn.startOfDay("-7d"))
//                        .orderBy(Jql.Field.PRIORITY, Jql.Direction.DESC)
//                        .build();
//
        // 3) Grouping: (summary ~ 'login' OR description ~ 'login') AND status in (...)
                String jql3 = Jql.builder()
                        .group()
                        .summaryContains("login")
                        .or()
                        .descriptionContains("login")
                        .end()
                        .and()
                        .statusIn(Status.TO_DO, Status.IN_PROGRESS)
                        .build();
//
//                System.out.println(jql1);
//                System.out.println(jql2);
                System.out.println(jql3);
    }
}

