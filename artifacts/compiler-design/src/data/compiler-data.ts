export const SOURCE_CODE = `BEGIN
PRINT "HELLO"
INTEGER A, B, C
REAL D, E
STRING X, Y
A := 2
B := 4
C := 6
D := -3.56E-8
E := 4.567
X := "text1"
Y := "hello there"
FOR I := 1 TO 5
PRINT "Strings are [X] and [Y]"
END`;

export interface Token {
  type: string;
  lexeme: string;
  id: number;
}

export const TOKENS: Token[] = [
  { type: "KEYWORD", lexeme: "BEGIN", id: 1 },
  { type: "KEYWORD", lexeme: "PRINT", id: 2 },
  { type: "STRING", lexeme: '"HELLO"', id: 3 },
  { type: "KEYWORD", lexeme: "INTEGER", id: 4 },
  { type: "IDENTIFIER", lexeme: "A", id: 5 },
  { type: "OPERATOR", lexeme: ",", id: 6 },
  { type: "IDENTIFIER", lexeme: "B", id: 7 },
  { type: "OPERATOR", lexeme: ",", id: 6 },
  { type: "IDENTIFIER", lexeme: "C", id: 8 },
  { type: "KEYWORD", lexeme: "REAL", id: 9 },
  { type: "IDENTIFIER", lexeme: "D", id: 10 },
  { type: "OPERATOR", lexeme: ",", id: 6 },
  { type: "IDENTIFIER", lexeme: "E", id: 11 },
  { type: "KEYWORD", lexeme: "STRING", id: 12 },
  { type: "IDENTIFIER", lexeme: "X", id: 13 },
  { type: "OPERATOR", lexeme: ",", id: 6 },
  { type: "IDENTIFIER", lexeme: "Y", id: 14 },
  { type: "IDENTIFIER", lexeme: "A", id: 5 },
  { type: "OPERATOR", lexeme: ":=", id: 15 },
  { type: "NUMBER", lexeme: "2", id: 16 },
  { type: "IDENTIFIER", lexeme: "B", id: 7 },
  { type: "OPERATOR", lexeme: ":=", id: 15 },
  { type: "NUMBER", lexeme: "4", id: 17 },
  { type: "IDENTIFIER", lexeme: "C", id: 8 },
  { type: "OPERATOR", lexeme: ":=", id: 15 },
  { type: "NUMBER", lexeme: "6", id: 18 },
  { type: "IDENTIFIER", lexeme: "D", id: 10 },
  { type: "OPERATOR", lexeme: ":=", id: 15 },
  { type: "NUMBER", lexeme: "-3.56E-8", id: 19 },
  { type: "IDENTIFIER", lexeme: "E", id: 11 },
  { type: "OPERATOR", lexeme: ":=", id: 15 },
  { type: "NUMBER", lexeme: "4.567", id: 20 },
  { type: "IDENTIFIER", lexeme: "X", id: 13 },
  { type: "OPERATOR", lexeme: ":=", id: 15 },
  { type: "STRING", lexeme: '"text1"', id: 21 },
  { type: "IDENTIFIER", lexeme: "Y", id: 14 },
  { type: "OPERATOR", lexeme: ":=", id: 15 },
  { type: "STRING", lexeme: '"hello there"', id: 22 },
  { type: "KEYWORD", lexeme: "FOR", id: 23 },
  { type: "IDENTIFIER", lexeme: "I", id: 24 },
  { type: "OPERATOR", lexeme: ":=", id: 15 },
  { type: "NUMBER", lexeme: "1", id: 25 },
  { type: "KEYWORD", lexeme: "TO", id: 26 },
  { type: "NUMBER", lexeme: "5", id: 27 },
  { type: "KEYWORD", lexeme: "PRINT", id: 2 },
  { type: "STRING", lexeme: '"Strings are [X] and [Y]"', id: 28 },
  { type: "KEYWORD", lexeme: "END", id: 29 },
];

export const SYM_KEYWORDS = ["BEGIN", "END", "FOR", "INTEGER", "PRINT", "REAL", "STRING", "TO"];
export const SYM_IDENTIFIERS = ["A", "B", "C", "D", "E", "I", "X", "Y"];
export const SYM_LITERALS = [
  '"HELLO"',
  '"Strings are [X] and [Y]"',
  '"hello there"',
  '"text1"',
  "-3.56E-8",
  "1",
  "2",
  "4",
  "4.567",
  "5",
  "6",
];

export interface GrammarRule {
  nonTerminal: string;
  productions: string[][];
}

export const GRAMMAR: GrammarRule[] = [
  { nonTerminal: "program", productions: [["BEGIN", "stmt_list", "END"]] },
  { nonTerminal: "stmt_list", productions: [["stmt", "stmt_list"], ["ε"]] },
  {
    nonTerminal: "stmt",
    productions: [
      ["PRINT", "expr", ";"],
      ["declaration"],
      ["assignment"],
      ["for_loop"],
    ],
  },
  { nonTerminal: "declaration", productions: [["type", "var_list", ";"]] },
  { nonTerminal: "type", productions: [["INTEGER"], ["REAL"], ["STRING"]] },
  { nonTerminal: "var_list", productions: [["IDENTIFIER", "var_list_tail"]] },
  {
    nonTerminal: "var_list_tail",
    productions: [[",", "IDENTIFIER", "var_list_tail"], ["ε"]],
  },
  { nonTerminal: "assignment", productions: [["IDENTIFIER", ":=", "expr", ";"]] },
  {
    nonTerminal: "for_loop",
    productions: [["FOR", "IDENTIFIER", ":=", "expr", "TO", "expr", "stmt_list", "END"]],
  },
  { nonTerminal: "expr", productions: [["IDENTIFIER"], ["NUMBER"], ["STRING"]] },
];

export interface FirstFollowRow {
  nonTerminal: string;
  set: string;
}

export const FIRST_SETS: FirstFollowRow[] = [
  { nonTerminal: "program", set: "BEGIN" },
  { nonTerminal: "stmt_list", set: "PRINT, INTEGER, REAL, STRING, FOR, END" },
  { nonTerminal: "declaration", set: "INTEGER, REAL, STRING" },
  { nonTerminal: "var_list", set: "IDENTIFIER" },
  { nonTerminal: "var_list_tail", set: ", ε" },
  { nonTerminal: "assignment", set: "IDENTIFIER" },
  { nonTerminal: "for_loop", set: "FOR" },
  { nonTerminal: "expr", set: "IDENTIFIER, NUMBER, STRING" },
  { nonTerminal: "type", set: "INTEGER, REAL, STRING" },
];

export const FOLLOW_SETS: FirstFollowRow[] = [
  { nonTerminal: "program", set: "$" },
  { nonTerminal: "stmt_list", set: "END" },
  { nonTerminal: "declaration", set: "PRINT, INTEGER, REAL, STRING, FOR, END" },
  { nonTerminal: "var_list", set: ";" },
  { nonTerminal: "var_list_tail", set: ";" },
  { nonTerminal: "assignment", set: "PRINT, INTEGER, REAL, STRING, FOR, END" },
  { nonTerminal: "for_loop", set: "PRINT, INTEGER, REAL, STRING, FOR, END" },
  { nonTerminal: "expr", set: "; )" },
  { nonTerminal: "type", set: "IDENTIFIER" },
];

export const PARSE_TABLE_HEADERS = [
  "Non-Terminal",
  "BEGIN",
  "PRINT",
  "INT",
  "REAL",
  "STR",
  "FOR",
  "END",
  "ID",
  ":=",
  "TO",
  "NUM",
  "STR_LIT",
  ";",
  ",",
  "$",
];

export const PARSE_TABLE_ROWS = [
  ["program", "BEGIN sl END", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
  ["stmt_list", "-", "s sl", "s sl", "s sl", "s sl", "s sl", "ε", "-", "-", "-", "-", "-", "-", "-", "-"],
  ["stmt", "-", "PRINT e ;", "decl", "decl", "decl", "for", "-", "asgn", "-", "-", "-", "-", "-", "-", "-"],
  ["declaration", "-", "-", "t vl ;", "t vl ;", "t vl ;", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
  ["type", "-", "-", "INTEGER", "REAL", "STRING", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
  ["var_list", "-", "-", "-", "-", "-", "-", "-", "id vt", "-", "-", "-", "-", "-", "-", "-"],
  ["var_list_tail", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "ε", ", id vt", "-"],
  ["assignment", "-", "-", "-", "-", "-", "-", "-", "id := e ;", "-", "-", "-", "-", "-", "-", "-"],
  ["for_loop", "-", "-", "-", "-", "-", "FOR id:=e TO e sl END", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
  ["expr", "-", "-", "-", "-", "-", "-", "-", "id", "-", "-", "num", "str", "-", "-", "-"],
];

export interface ParsingAction {
  step: number;
  stack: string;
  input: string;
  action: string;
}

export const PARSING_ACTIONS: ParsingAction[] = [
  { step: 1, stack: "$", input: "", action: "Start parsing" },
  { step: 2, stack: "$", input: "BEGIN", action: "Apply: program → BEGIN stmt_list END" },
  { step: 3, stack: "$ BEGIN", input: "BEGIN", action: "Match 'BEGIN'" },
  { step: 4, stack: "$", input: "PRINT", action: "Apply: stmt_list → stmt stmt_list" },
  { step: 5, stack: "$", input: "PRINT", action: "Apply: stmt → PRINT expr ;" },
  { step: 6, stack: "$ PRINT", input: "PRINT", action: "Match 'PRINT'" },
  { step: 7, stack: "$", input: '"HELLO"', action: "Apply: expr → STRING" },
  { step: 8, stack: "$ STRING", input: '"HELLO"', action: "Match '\"HELLO\"'" },
  { step: 9, stack: "$ ;", input: ";", action: "Match ';'" },
  { step: 10, stack: "$", input: "INTEGER", action: "Apply: stmt_list → stmt stmt_list" },
  { step: 11, stack: "$", input: "INTEGER", action: "Apply: stmt → declaration" },
  { step: 12, stack: "$", input: "INTEGER", action: "Apply: declaration → type var_list ;" },
  { step: 13, stack: "$", input: "INTEGER", action: "Apply: type → INTEGER" },
  { step: 14, stack: "$ INTEGER", input: "INTEGER", action: "Match 'INTEGER'" },
  { step: 15, stack: "$", input: "A", action: "Apply: var_list → IDENTIFIER var_list_tail" },
  { step: 16, stack: "$ IDENTIFIER", input: "A", action: "Match 'A'" },
  { step: 17, stack: "$", input: ",", action: "Apply: var_list_tail → , IDENTIFIER var_list_tail" },
  { step: 18, stack: "$ ,", input: ",", action: "Match ','" },
  { step: 19, stack: "$ IDENTIFIER", input: "B", action: "Match 'B'" },
  { step: 20, stack: "$", input: ",", action: "Apply: var_list_tail → , IDENTIFIER var_list_tail" },
  { step: 21, stack: "$ ,", input: ",", action: "Match ','" },
  { step: 22, stack: "$ IDENTIFIER", input: "C", action: "Match 'C'" },
  { step: 23, stack: "$", input: ";", action: "Apply: var_list_tail → ε" },
  { step: 24, stack: "$ ;", input: ";", action: "Match ';'" },
  { step: 25, stack: "$", input: "REAL", action: "Apply: stmt_list → stmt stmt_list" },
  { step: 26, stack: "$", input: "REAL", action: "Apply: stmt → declaration" },
  { step: 27, stack: "$", input: "REAL", action: "Apply: declaration → type var_list ;" },
  { step: 28, stack: "$", input: "REAL", action: "Apply: type → REAL" },
  { step: 29, stack: "$ REAL", input: "REAL", action: "Match 'REAL'" },
  { step: 30, stack: "$", input: "D", action: "Apply: var_list → IDENTIFIER var_list_tail" },
  { step: 31, stack: "$ IDENTIFIER", input: "D", action: "Match 'D'" },
  { step: 32, stack: "$", input: ",", action: "Apply: var_list_tail → , IDENTIFIER var_list_tail" },
  { step: 33, stack: "$ ,", input: ",", action: "Match ','" },
  { step: 34, stack: "$ IDENTIFIER", input: "E", action: "Match 'E'" },
  { step: 35, stack: "$", input: ";", action: "Apply: var_list_tail → ε" },
  { step: 36, stack: "$ ;", input: ";", action: "Match ';'" },
  { step: 37, stack: "$", input: "STRING", action: "Apply: stmt_list → stmt stmt_list" },
  { step: 38, stack: "$", input: "STRING", action: "Apply: stmt → declaration" },
  { step: 39, stack: "$", input: "STRING", action: "Apply: declaration → type var_list ;" },
  { step: 40, stack: "$", input: "STRING", action: "Apply: type → STRING" },
  { step: 41, stack: "$ STRING", input: "STRING", action: "Match 'STRING'" },
  { step: 42, stack: "$", input: "X", action: "Apply: var_list → IDENTIFIER var_list_tail" },
  { step: 43, stack: "$ IDENTIFIER", input: "X", action: "Match 'X'" },
  { step: 44, stack: "$", input: ",", action: "Apply: var_list_tail → , IDENTIFIER var_list_tail" },
  { step: 45, stack: "$ ,", input: ",", action: "Match ','" },
  { step: 46, stack: "$ IDENTIFIER", input: "Y", action: "Match 'Y'" },
  { step: 47, stack: "$", input: ";", action: "Apply: var_list_tail → ε" },
  { step: 48, stack: "$ ;", input: ";", action: "Match ';'" },
  { step: 49, stack: "$", input: "A", action: "Apply: stmt_list → stmt stmt_list" },
  { step: 50, stack: "$", input: "A", action: "Apply: stmt → assignment" },
  { step: 51, stack: "$", input: "A", action: "Apply: assignment → IDENTIFIER := expr ;" },
  { step: 52, stack: "$ IDENTIFIER", input: "A", action: "Match 'A'" },
  { step: 53, stack: "$ :=", input: ":=", action: "Match ':='" },
  { step: 54, stack: "$", input: "2", action: "Apply: expr → NUMBER" },
  { step: 55, stack: "$ NUMBER", input: "2", action: "Match '2'" },
  { step: 56, stack: "$ ;", input: ";", action: "Match ';'" },
  { step: 57, stack: "$", input: "B", action: "Apply: stmt_list → stmt stmt_list" },
  { step: 58, stack: "$", input: "B", action: "Apply: stmt → assignment" },
  { step: 59, stack: "$", input: "B", action: "Apply: assignment → IDENTIFIER := expr ;" },
  { step: 60, stack: "$ IDENTIFIER", input: "B", action: "Match 'B'" },
  { step: 61, stack: "$ :=", input: ":=", action: "Match ':='" },
  { step: 62, stack: "$", input: "4", action: "Apply: expr → NUMBER" },
  { step: 63, stack: "$ NUMBER", input: "4", action: "Match '4'" },
  { step: 64, stack: "$ ;", input: ";", action: "Match ';'" },
  { step: 65, stack: "$", input: "C", action: "Apply: stmt_list → stmt stmt_list" },
  { step: 66, stack: "$", input: "C", action: "Apply: stmt → assignment" },
  { step: 67, stack: "$", input: "C", action: "Apply: assignment → IDENTIFIER := expr ;" },
  { step: 68, stack: "$ IDENTIFIER", input: "C", action: "Match 'C'" },
  { step: 69, stack: "$ :=", input: ":=", action: "Match ':='" },
  { step: 70, stack: "$", input: "6", action: "Apply: expr → NUMBER" },
  { step: 71, stack: "$ NUMBER", input: "6", action: "Match '6'" },
  { step: 72, stack: "$ ;", input: ";", action: "Match ';'" },
  { step: 73, stack: "$", input: "D", action: "Apply: stmt_list → stmt stmt_list" },
  { step: 74, stack: "$", input: "D", action: "Apply: stmt → assignment" },
  { step: 75, stack: "$", input: "D", action: "Apply: assignment → IDENTIFIER := expr ;" },
  { step: 76, stack: "$ IDENTIFIER", input: "D", action: "Match 'D'" },
  { step: 77, stack: "$ :=", input: ":=", action: "Match ':='" },
  { step: 78, stack: "$", input: "-3.56E-8", action: "Apply: expr → NUMBER" },
  { step: 79, stack: "$ NUMBER", input: "-3.56E-8", action: "Match '-3.56E-8'" },
  { step: 80, stack: "$ ;", input: ";", action: "Match ';'" },
  { step: 81, stack: "$", input: "E", action: "Apply: stmt_list → stmt stmt_list" },
  { step: 82, stack: "$", input: "E", action: "Apply: stmt → assignment" },
  { step: 83, stack: "$", input: "E", action: "Apply: assignment → IDENTIFIER := expr ;" },
  { step: 84, stack: "$ IDENTIFIER", input: "E", action: "Match 'E'" },
  { step: 85, stack: "$ :=", input: ":=", action: "Match ':='" },
  { step: 86, stack: "$", input: "4.567", action: "Apply: expr → NUMBER" },
  { step: 87, stack: "$ NUMBER", input: "4.567", action: "Match '4.567'" },
  { step: 88, stack: "$ ;", input: ";", action: "Match ';'" },
  { step: 89, stack: "$", input: "X", action: "Apply: stmt_list → stmt stmt_list" },
  { step: 90, stack: "$", input: "X", action: "Apply: stmt → assignment" },
  { step: 91, stack: "$", input: "X", action: "Apply: assignment → IDENTIFIER := expr ;" },
  { step: 92, stack: "$ IDENTIFIER", input: "X", action: "Match 'X'" },
  { step: 93, stack: "$ :=", input: ":=", action: "Match ':='" },
  { step: 94, stack: "$", input: '"text1"', action: "Apply: expr → STRING" },
  { step: 95, stack: "$ STRING", input: '"text1"', action: "Match '\"text1\"'" },
  { step: 96, stack: "$ ;", input: ";", action: "Match ';'" },
  { step: 97, stack: "$", input: "Y", action: "Apply: stmt_list → stmt stmt_list" },
  { step: 98, stack: "$", input: "Y", action: "Apply: stmt → assignment" },
  { step: 99, stack: "$", input: "Y", action: "Apply: assignment → IDENTIFIER := expr ;" },
  { step: 100, stack: "$ IDENTIFIER", input: "Y", action: "Match 'Y'" },
  { step: 101, stack: "$ :=", input: ":=", action: "Match ':='" },
  { step: 102, stack: "$", input: '"hello there"', action: "Apply: expr → STRING" },
  { step: 103, stack: "$ STRING", input: '"hello there"', action: "Match '\"hello there\"'" },
  { step: 104, stack: "$ ;", input: ";", action: "Match ';'" },
  { step: 105, stack: "$", input: "FOR", action: "Apply: stmt_list → stmt stmt_list" },
  { step: 106, stack: "$", input: "FOR", action: "Apply: stmt → for_loop" },
  { step: 107, stack: "$", input: "FOR", action: "Apply: for_loop → FOR IDENTIFIER := expr TO expr stmt_list END" },
  { step: 108, stack: "$ FOR", input: "FOR", action: "Match 'FOR'" },
  { step: 109, stack: "$ IDENTIFIER", input: "I", action: "Match 'I'" },
  { step: 110, stack: "$ :=", input: ":=", action: "Match ':='" },
  { step: 111, stack: "$", input: "1", action: "Apply: expr → NUMBER" },
  { step: 112, stack: "$ NUMBER", input: "1", action: "Match '1'" },
  { step: 113, stack: "$ TO", input: "TO", action: "Match 'TO'" },
  { step: 114, stack: "$", input: "5", action: "Apply: expr → NUMBER" },
  { step: 115, stack: "$ NUMBER", input: "5", action: "Match '5'" },
  { step: 116, stack: "$", input: "PRINT", action: "Apply: stmt_list → stmt stmt_list" },
  { step: 117, stack: "$", input: "PRINT", action: "Apply: stmt → PRINT expr ;" },
  { step: 118, stack: "$ PRINT", input: "PRINT", action: "Match 'PRINT'" },
  { step: 119, stack: "$", input: '"Strings are [X] and [Y]"', action: "Apply: expr → STRING" },
  { step: 120, stack: "$ STRING", input: '"Strings are [X] and [Y]"', action: "Match '\"Strings are [X] and [Y]\"'" },
  { step: 121, stack: "$ ;", input: ";", action: "Match ';'" },
  { step: 122, stack: "$", input: "END", action: "Apply: stmt_list → ε" },
  { step: 123, stack: "$", input: "END", action: "Apply: stmt_list → ε" },
  { step: 124, stack: "$ END", input: "END", action: "Match 'END'" },
  { step: 125, stack: "$", input: "$", action: "Parsing completed successfully!" },
];
