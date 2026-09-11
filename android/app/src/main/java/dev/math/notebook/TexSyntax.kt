package dev.math.notebook

/** Offsets always refer to the original source; this parser never edits the document. */
object TexSyntax {
    data class Token(val start: Int, val end: Int, val kind: String)

    data class Problem(val start: Int, val end: Int, val message: String)

    data class Block(
        val start: Int,
        val end: Int,
        val contentStart: Int,
        val contentEnd: Int,
        val display: Boolean,
        val closed: Boolean,
    )

    data class Document(
        val blocks: List<Block>,
        val tokens: List<Token>,
        val problems: List<Problem>,
        val pairs: Map<Int, Int>,
    )

    /** Escape ordinary paragraphs for Markdown, honoring the editor's literal-dollar escape. */
    fun previewProse(source: String): String {
        val result = StringBuilder()
        var i = 0
        while (i < source.length) {
            val c =
                if (source[i] == '\\' && i + 1 < source.length && source[i + 1] == '$') {
                    i++
                    '$'
                } else source[i]
            if (c in "\\`*_{}[]<>#$") result.append('\\')
            result.append(c)
            i++
        }
        return result.toString()
    }

    fun parse(source: String, commands: Set<String>, skipCode: Boolean = false): Document {
        val blocks = mutableListOf<Block>()
        val tokens = mutableListOf<Token>()
        val problems = mutableListOf<Problem>()
        val pairs = mutableMapOf<Int, Int>()
        var i = 0
        while (i < source.length) {
            if (skipCode && source[i] == '`') {
                val end = source.indexOf('`', i + 1)
                i = if (end >= 0) end + 1 else source.length
                continue
            }
            if (source[i] == '\\') {
                i += if (i + 1 < source.length) 2 else 1
                continue
            }
            if (source[i] != '$') {
                i++
                continue
            }
            val start = i
            val display = i + 1 < source.length && source[i + 1] == '$'
            val width = if (display) 2 else 1
            i += width
            val contentStart = i
            tokens += Token(start, i, "delimiter")
            val braces = ArrayDeque<Int>()
            val environments = ArrayDeque<Pair<String, Int>>()
            var closed = false
            while (i < source.length) {
                val c = source[i]
                if (c == '$') {
                    val actual = if (i + 1 < source.length && source[i + 1] == '$') 2 else 1
                    if (actual == width) {
                        closed = true
                        break
                    }
                    problems +=
                        Problem(
                            i,
                            i + actual,
                            "Use the same number of dollar signs to close this math block.",
                        )
                    tokens += Token(i, i + actual, "delimiter")
                    i += actual
                    continue
                }
                if (c == '\\') {
                    val begin = i++
                    if (i >= source.length) {
                        problems += Problem(begin, i, "Finish the command after the backslash.")
                        break
                    }
                    if (source[i].isLetter()) while (i < source.length && source[i].isLetter()) i++
                    else i++
                    val command =
                        source.substring(begin + 1, i).let {
                            if (it.all(Char::isWhitespace)) " " else it
                        }
                    tokens += Token(begin, i, "command")
                    if (command !in commands)
                        problems +=
                            Problem(
                                begin,
                                i,
                                "Unsupported command \\$command. Open Syntax help for supported commands.",
                            )
                    if (command == "begin" || command == "end") {
                        val match =
                            Regex("\\{([a-zA-Z*]+)\\}").find(source, i)?.takeIf {
                                it.range.first == i
                            }
                        if (match != null) {
                            val name = match.groupValues[1]
                            if (
                                name !in
                                    setOf(
                                        "matrix",
                                        "pmatrix",
                                        "bmatrix",
                                        "cases",
                                        "aligned",
                                        "array",
                                    )
                            )
                                problems +=
                                    Problem(
                                        begin,
                                        match.range.last + 1,
                                        "This environment is not supported.",
                                    )
                            if (command == "begin") environments.addLast(name to begin)
                            else if (environments.isEmpty() || environments.last().first != name)
                                problems +=
                                    Problem(
                                        begin,
                                        match.range.last + 1,
                                        "This end does not match the open environment.",
                                    )
                            else environments.removeLast()
                        } else
                            problems +=
                                Problem(
                                    begin,
                                    i,
                                    "Add an environment name in braces, such as {matrix}.",
                                )
                    }
                    continue
                }
                when (c) {
                    '{' -> {
                        braces.addLast(i)
                        tokens += Token(i, i + 1, "brace")
                    }
                    '}' -> {
                        tokens += Token(i, i + 1, "brace")
                        if (braces.isEmpty())
                            problems +=
                                Problem(i, i + 1, "This closing brace has no opening brace.")
                        else {
                            val open = braces.removeLast()
                            pairs[open] = i
                            pairs[i] = open
                        }
                    }
                    '^',
                    '_' -> tokens += Token(i, i + 1, "script")
                    '+',
                    '-',
                    '=',
                    '<',
                    '>',
                    '*',
                    '/',
                    '&' -> tokens += Token(i, i + 1, "operator")
                }
                i++
            }
            val contentEnd = i
            braces.forEach {
                problems += Problem(it, it + 1, "Add a closing brace for this group.")
            }
            environments.forEach { (name, at) ->
                problems += Problem(at, at + 1, "Close this environment with \\end{$name}.")
            }
            if (closed) {
                tokens += Token(i, i + width, "delimiter")
                i += width
            } else
                problems +=
                    Problem(
                        start,
                        start + width,
                        if (display) "Close display math with two dollar signs."
                        else "Close inline math with a dollar sign.",
                    )
            blocks += Block(start, i, contentStart, contentEnd, display, closed)
        }
        return Document(blocks, tokens, problems, pairs)
    }
}
