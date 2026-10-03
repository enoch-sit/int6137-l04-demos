(function () {
  const lang = document.body.dataset.lang === "zh" ? "zh" : "en";
  const demo = document.body.dataset.demo || "";
  const zh = lang === "zh";
  const PASS = zh ? "十个工作日" : "ten working days";
  const FAIL = zh ? "暑假旅游" : "Summer trip";
  const sample = "../samples/" + lang + "/";
  const app = document.getElementById("app");
  if (!app || !demo) return;

  const t = zh
    ? {
        specimen: "标本页",
        selector: "CSS 选择器",
        parse: "解析",
        bodyOnly: "只要正文",
        wrongPage: "错误：整页",
        wrongAd: "错误：广告",
        matched: "匹配到的 HTML",
        markdown: "要写入的 Markdown",
        url: "一个网址",
        urls: "网址列表（由你写好，程序不去找链接）",
        fetch: "抓取一次",
        fetchAll: "按列表抓取",
        useSample: "用课上的样本",
        pickFile: "或选择自己的文件",
        pdfNote: "读的是文字层里的字符。这一页不把 PDF 画出来。没有文字层的扫描件要先 OCR，这节课不做。",
        wordNote: ".docx 先读出段落，再包进 article.policy，然后用同一个选择器。",
        githubNote: "默认是本文件夹里的那一份原文，当作你已经知道路径的那个文件。公开仓库的 raw 地址也可以贴进来。",
        path: "文件路径",
        key: "OpenRouter 密钥",
        project: "Supabase 项目地址",
        publishable: "publishable key",
        write: "写入三句",
        query: "查询",
        ranks: "排好的行",
        messages: "messages[]（还没有发给聊天模型）",
        needKey: "先填密钥、项目地址和 publishable key。secret key 不要出现在这个页面上。",
        questions: ["怎么请假", "我对什么过敏", "暑假去哪"],
        lines: [
          { id: "leave", source: "demo", content: "教职员请于出发前十个工作日提交年假申请。" },
          { id: "allergy", source: "demo", content: "我对花生过敏。" },
          { id: "ad", source: "demo", content: "暑假旅游 3 折。" }
        ]
      }
    : {
        specimen: "Specimen page",
        selector: "CSS selector",
        parse: "Parse",
        bodyOnly: "Body only",
        wrongPage: "Wrong: whole page",
        wrongAd: "Wrong: ad",
        matched: "Matched HTML",
        markdown: "Markdown to store",
        url: "One URL",
        urls: "URL list (you typed these; the page does not follow links)",
        fetch: "Fetch once",
        fetchAll: "Fetch the list",
        useSample: "Use the class sample",
        pickFile: "Or choose your own file",
        pdfNote: "This reads characters in the text layer. It does not draw the PDF. A scan with no text layer needs OCR, which this hour does not build.",
        wordNote: "The .docx paragraphs are wrapped in article.policy, then the same selector runs.",
        githubNote: "The default file is the raw text in this folder: one path you already know. A public raw.githubusercontent.com URL also works.",
        path: "File path",
        key: "OpenRouter key",
        project: "Supabase project URL",
        publishable: "publishable key",
        write: "Write three sentences",
        query: "Query",
        ranks: "Ranked rows",
        messages: "messages[] (not sent to a chat model)",
        needKey: "Enter the key, the project URL, and the publishable key. Do not put a secret key on this page.",
        questions: ["How do I apply for leave?", "What am I allergic to?", "Where is the summer trip?"],
        lines: [
          { id: "leave", source: "demo", content: "Apply ten working days before you travel." },
          { id: "allergy", source: "demo", content: "I am allergic to peanuts." },
          { id: "ad", source: "demo", content: "Summer trip, 70% off." }
        ]
      };

  const specimen = zh
    ? specimenHtml(
        "Cookie 条 · 全部接受 · 这不是政策正文",
        "导航：首页 · 关于 · 登录 · 这不是政策正文",
        "侧栏广告 · 暑假旅游 3 折 · 这不是政策正文",
        "年假申请流程",
        "教职员请于出发前十个工作日在门户提交申请。"
      )
    : specimenHtml(
        "Cookie bar · Accept all · not the policy",
        "Nav: Home · About · Sign in · not the policy",
        "Sidebar ad · Summer trip, 70% off · not the policy",
        "Annual leave",
        "Apply ten working days before you travel."
      );

  let lastHtml = "";
  let question = t.questions[0];

  function adWrap(text) {
    const ad = zh ? "侧栏广告 · 暑假旅游 3 折 · 这不是政策正文" : "Sidebar ad · Summer trip, 70% off · not the policy";
    return "<div class='ads'>" + ad + "</div><article class='policy'><p>" + escapeHtml(text) + "</p></article>";
  }

  function specimenHtml(cookie, nav, ad, title, body) {
    return (
      '<div class="cookie">' + cookie + "</div>" +
      '<nav class="site-nav">' + nav + "</nav>" +
      '<div class="ads">' + ad + "</div>" +
      '<article class="policy" id="leave-policy"><h1>' + title + "</h1><p>" + body + "</p></article>"
    );
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function termButton(attr, item) {
    const en = item[2] ? "<span class='en-term'>" + escapeHtml(item[2]) + "</span>" : "";
    return "<button type='button' data-" + attr + "='" + item[0] + "'>" + item[1] + en + "</button>";
  }

  function toMarkdown(root) {
    const lines = [];
    root.querySelectorAll("h1,h2,h3,p,li").forEach(function (el) {
      const text = el.innerText.trim();
      if (!text) return;
      if (el.tagName === "H1") lines.push("# " + text);
      else if (el.tagName === "H2") lines.push("## " + text);
      else if (el.tagName === "LI") lines.push("- " + text);
      else lines.push(text);
      lines.push("");
    });
    return lines.join("\n").trim();
  }

  function parse(html, selector) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    let nodes = [];
    try { nodes = Array.from(doc.querySelectorAll(selector)); } catch (err) { nodes = []; }
    const text = nodes.map(function (n) { return n.innerText.trim(); }).filter(Boolean).join("\n\n");
    const markdown = nodes.map(toMarkdown).filter(Boolean).join("\n\n");
    const kept = nodes.map(function (n) { return n.outerHTML; }).join("\n");
    return { count: nodes.length, text: text, markdown: markdown, html: kept };
  }

  function judge(text) {
    const hasPass = text.indexOf(PASS) !== -1;
    const hasFail = text.indexOf(FAIL) !== -1;
    return { hasPass: hasPass, hasFail: hasFail, ok: hasPass && !hasFail };
  }

  function setStatus(message, kind) {
    const el = document.getElementById("status");
    if (!el) return;
    el.textContent = message;
    el.className = kind || "";
  }

  function showParse(result, statusText, kind) {
    document.getElementById("html-out").textContent = result.html || (zh ? "（没有节点）" : "(no nodes)");
    document.getElementById("md-out").textContent = result.markdown || "";
    setStatus(statusText, kind);
  }

  function statusFor(result) {
    if (!result.count) {
      return { text: zh ? "0 个节点" : "0 nodes", kind: "bad" };
    }
    const j = judge(result.text);
    if (j.hasFail) {
      return {
        text: zh ? "未通过。留下的文字里还有「" + FAIL + "」。" : "Fail. The kept text still contains “" + FAIL + "”.",
        kind: "bad"
      };
    }
    if (j.ok) {
      return {
        text: zh ? "通过。留下的文字里有「" + PASS + "」。" : "Pass. The kept text contains “" + PASS + "”.",
        kind: "ok"
      };
    }
    return {
      text: zh
        ? result.count + " 个节点。没有广告，也没有「" + PASS + "」。"
        : result.count + " node(s). The ad is gone, and “" + PASS + "” is not in this chunk.",
      kind: "ok"
    };
  }

  function runSelector(html) {
    lastHtml = html;
    const selector = document.getElementById("selector").value.trim() || "article.policy";
    const result = parse(html, selector);
    const status = statusFor(result);
    showParse(result, status.text, status.kind);
  }

  function parserPanel(extra) {
    return (
      '<section class="panel">' +
      "<label for='selector'>" + t.selector + "</label>" +
      "<input id='selector' type='text' value='article.policy' spellcheck='false' />" +
      '<div class="row">' +
      "<button type='button' class='primary' id='run'>" + t.parse + "</button>" +
      "<button type='button' data-sel='article.policy'>" + t.bodyOnly + "</button>" +
      "<button type='button' data-sel='body'>" + t.wrongPage + "</button>" +
      "<button type='button' data-sel='.ads'>" + t.wrongAd + "</button>" +
      "</div>" +
      (extra || "") +
      "<p id='status'></p>" +
      "<h2>" + t.matched + "</h2><pre id='html-out'></pre>" +
      "<h2>" + t.markdown + "</h2><pre id='md-out'></pre>" +
      "</section>"
    );
  }

  function bindSelectorButtons(getHtml) {
    document.getElementById("run").addEventListener("click", function () {
      Promise.resolve(getHtml()).then(runSelector).catch(function (err) {
        setStatus(err.message || String(err), "bad");
      });
    });
    document.querySelectorAll("[data-sel]").forEach(function (button) {
      button.addEventListener("click", function () {
        document.getElementById("selector").value = button.getAttribute("data-sel");
        Promise.resolve(getHtml()).then(runSelector).catch(function (err) {
          setStatus(err.message || String(err), "bad");
        });
      });
    });
  }

  if (demo === "local") {
    app.innerHTML =
      '<div class="columns"><section class="panel specimen"><h2>' + t.specimen + "</h2><div id='specimen'>" +
      specimen + "</div></section>" + parserPanel("") + "</div>";
    bindSelectorButtons(function () {
      return "<body>" + document.getElementById("specimen").innerHTML + "</body>";
    });
    document.getElementById("run").click();
    return;
  }

  if (demo === "url" || demo === "pages" || demo === "github") {
    const field = demo === "pages"
      ? "<label for='urls'>" + t.urls + "</label><textarea id='urls' spellcheck='false'>" +
        [sample + "page-a.html", sample + "page-b.html", sample + "page-c.html"].join("\n") + "</textarea>"
      : "<label for='url'>" + (demo === "github" ? t.path : t.url) + "</label><input id='url' type='text' spellcheck='false' value='" +
        (demo === "github" ? sample + "leave.md" : sample + "page-a.html") + "' />";
    const note = demo === "github" ? "<p class='hint'>" + t.githubNote + "</p>" : "";
    const button = demo === "pages" ? t.fetchAll : t.fetch;
    app.innerHTML =
      '<div class="columns"><section class="panel"><h2>' + (demo === "github" ? t.path : t.url) + "</h2>" +
      note + field +
      "<div class='row'><button type='button' class='primary' id='fetch'>" + button + "</button></div>" +
      "<pre id='fetched'></pre></section>" + parserPanel("") + "</div>";

    async function load() {
      if (demo === "pages") {
        const urls = document.getElementById("urls").value.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
        const chunks = [];
        for (let i = 0; i < urls.length; i++) {
          const res = await fetch(urls[i]);
          if (!res.ok) throw new Error(urls[i] + " HTTP " + res.status);
          const doc = new DOMParser().parseFromString(await res.text(), "text/html");
          chunks.push(doc.body.innerHTML);
        }
        document.getElementById("fetched").textContent = zh
          ? "抓了 " + chunks.length + " 个地址，各一次。"
          : "Fetched " + chunks.length + " addresses, once each.";
        return "<div>" + chunks.join("\n") + "</div>";
      }
      const url = document.getElementById("url").value.trim();
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      let text = await res.text();
      if (demo === "github") {
        text = adWrap(text);
      }
      document.getElementById("fetched").textContent = text.slice(0, 1200);
      return text;
    }

    document.getElementById("fetch").addEventListener("click", function () {
      load().then(runSelector).catch(function (err) { setStatus(err.message || String(err), "bad"); });
    });
    bindSelectorButtons(function () {
      return lastHtml || load();
    });
    document.getElementById("fetch").click();
    return;
  }

  if (demo === "pdf" || demo === "word") {
    const note = demo === "pdf" ? t.pdfNote : t.wordNote;
    const file = demo === "pdf" ? sample + "leave.pdf" : sample + "leave.docx";
    app.innerHTML =
      '<div class="columns"><section class="panel"><h2>' + (demo === "pdf" ? "PDF" : "Word") + "</h2>" +
      "<p class='hint'>" + note + "</p>" +
      "<div class='row'><button type='button' class='primary' id='sample'>" + t.useSample + "</button></div>" +
      "<label>" + t.pickFile + "</label><input id='file' type='file' />" +
      "<h2>HTML</h2><pre id='fetched'></pre></section>" + parserPanel("") + "</div>";

    async function fromBuffer(buffer) {
      const text = demo === "pdf" ? pdfText(buffer) : await docxText(buffer);
      if (!text) throw new Error(zh ? "没有读到文字" : "No text found");
      const html = adWrap(text);
      document.getElementById("fetched").textContent = html;
      return html;
    }

    document.getElementById("sample").addEventListener("click", function () {
      fetch(file).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.arrayBuffer();
      }).then(fromBuffer).then(runSelector).catch(function (err) {
        setStatus(err.message || String(err), "bad");
      });
    });
    document.getElementById("file").addEventListener("change", function (event) {
      const f = event.target.files && event.target.files[0];
      if (!f) return;
      f.arrayBuffer().then(fromBuffer).then(runSelector).catch(function (err) {
        setStatus(err.message || String(err), "bad");
      });
    });
    bindSelectorButtons(function () { return lastHtml; });
    document.getElementById("sample").click();
    return;
  }

  if (demo === "query") {
    app.innerHTML =
      "<section class='panel'>" +
      "<div class='field'><label for='apikey'>" + t.key + "</label><input id='apikey' type='password' autocomplete='off' /></div>" +
      "<div class='field'><label for='supabase-url'>" + t.project + "</label><input id='supabase-url' type='text' placeholder='https://xxxx.supabase.co' autocomplete='off' /></div>" +
      "<div class='field'><label for='publishable'>" + t.publishable + "</label><input id='publishable' type='password' autocomplete='off' /></div>" +
      "<div class='sentences'>" + t.lines.map(function (line) {
        return "<article><span class='tag'>id · " + line.id + "</span>" + escapeHtml(line.content) + "</article>";
      }).join("") + "</div>" +
      "<h2>" + (zh ? "点一题，立刻查询" : "Click a question to search") + "</h2>" +
      "<p class='hint'>" + (zh
        ? "深色按钮是正在查的那一句。点它会查询。浅绿色只是还没点中。先点写入三句，库里才有行。"
        : "The dark button is the question being searched. Clicking it runs the query. A light green button is not selected. Write the three sentences first, or the table has no rows.") + "</p>" +
      "<div class='row' id='questions'></div>" +
      "<p id='q-now' class='hint'></p>" +
      "<div class='row'><button type='button' class='primary' id='store'>" + t.write + "</button><button type='button' id='ask'>" + (zh ? "再查一次当前问题" : "Search the current question again") + "</button></div>" +
      "<p id='status'></p>" +
      "<h2>" + t.ranks + "</h2><div id='ranks'></div>" +
      "<h2>" + t.messages + "</h2><pre id='messages'></pre>" +
      "</section>";

    const qBox = document.getElementById("questions");
    function markQuestion() {
      qBox.querySelectorAll("button").forEach(function (b) {
        b.classList.toggle("on", b.textContent === question);
      });
      document.getElementById("q-now").textContent = (zh ? "当前问题：" : "Current question: ") + question;
    }
    t.questions.forEach(function (q) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = q;
      b.addEventListener("click", function () {
        question = q;
        markQuestion();
        runQuery();
      });
      qBox.appendChild(b);
    });
    markQuestion();

    function ready() {
      if (!document.getElementById("apikey").value.trim() || !document.getElementById("supabase-url").value.trim() || !document.getElementById("publishable").value.trim()) {
        setStatus(t.needKey, "bad");
        return false;
      }
      return true;
    }

    function projectUrl() {
      return document.getElementById("supabase-url").value.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/i, "");
    }

    async function embed(input) {
      const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + document.getElementById("apikey").value.trim()
        },
        body: JSON.stringify({ model: "qwen/qwen3-embedding-4b", input: input, dimensions: 1024 })
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok || data.error) {
        const msg = (data.error && data.error.message) || res.statusText || "request failed";
        throw new Error("HTTP " + res.status + " " + String(msg).slice(0, 180));
      }
      return data.data.slice().sort(function (a, b) { return a.index - b.index; }).map(function (row) { return row.embedding; });
    }

    async function supabase(path, body, prefer) {
      const key = document.getElementById("publishable").value.trim();
      const headers = { "Content-Type": "application/json", apikey: key, Authorization: "Bearer " + key };
      if (prefer) headers.Prefer = prefer;
      const res = await fetch(projectUrl() + path, { method: "POST", headers: headers, body: JSON.stringify(body) });
      const text = await res.text();
      let data = null;
      if (text) { try { data = JSON.parse(text); } catch (e) { data = text; } }
      if (!res.ok) throw new Error("HTTP " + res.status + " " + String(data && data.message ? data.message : text).slice(0, 180));
      return data;
    }

    document.getElementById("store").addEventListener("click", async function () {
      if (!ready()) return;
      setStatus(zh ? "正在向 OpenRouter 要 1024 个数…" : "Asking OpenRouter for 1024 numbers…", "");
      try {
        const vectors = await embed(t.lines.map(function (line) { return line.content; }));
        if (vectors.some(function (v) { return v.length !== 1024; })) {
          setStatus(zh ? "返回的长度不是 1024" : "A vector came back with a length other than 1024", "bad");
          return;
        }
        await supabase("/rest/v1/lesson_chunks?on_conflict=id", t.lines.map(function (line, i) {
          return { id: line.id, content: line.content, source: line.source, embedding: vectors[i] };
        }), "resolution=merge-duplicates");
        setStatus(zh ? "三句已写入 lesson_chunks。长度 1024。" : "Three rows are in lesson_chunks. Length 1024.", "ok");
      } catch (err) {
        setStatus(err.message || String(err), "bad");
      }
    });

    async function runQuery() {
      if (!ready()) return;
      setStatus((zh ? "正在查询：" : "Searching: ") + question, "");
      try {
        const vector = (await embed([question]))[0];
        if (vector.length !== 1024) {
          setStatus(zh ? "返回的长度不是 1024" : "The vector length is not 1024", "bad");
          return;
        }
        const rows = await supabase("/rest/v1/rpc/match_lesson_chunks", { query_embedding: vector, match_count: 3 });
        const list = Array.isArray(rows) ? rows : [];
        document.getElementById("ranks").innerHTML = list.map(function (row, i) {
          return "<article class='" + (i === 0 ? "policy" : "") + "'><span class='tag'>id · " + escapeHtml(row.id) + " · " + Number(row.similarity).toFixed(2) + "</span><p>" + escapeHtml(row.content) + "</p></article>";
        }).join("") || "<p class='hint'>—</p>";
        const top = list[0];
        const messages = [
          { role: "system", content: zh ? "只根据下面这一条课文回答。" : "Answer using only the passage below." },
          top ? { role: "system", content: top.content } : null,
          { role: "user", content: question }
        ].filter(Boolean);
        document.getElementById("messages").textContent = JSON.stringify(messages, null, 2);
        setStatus(top
          ? (zh ? "最近的是 " : "Nearest is ") + top.id
          : (zh ? "库里还没有句子。先点写入。" : "No rows yet. Write the three sentences first."),
          top ? "ok" : "bad");
      } catch (err) {
        setStatus(err.message || String(err), "bad");
      }
    }

    document.getElementById("ask").addEventListener("click", runQuery);
  }

  if (demo === "manage") {
    app.innerHTML =
      "<p id='status'></p>" +
      "<div class='columns'>" +
      "<section class='panel'>" +
      "<h2>" + (zh ? "文件夹" : "Folder") + "</h2>" +
      "<p class='hint'>" + (zh
        ? "选一个文件夹。一个文本文件是 lesson_chunks 里的一行，整篇不切块。文件名写在 source。覆盖正文时，这一行的 1024 个数一并覆盖。这一阶段只收 .txt、.md 和 .markdown。全班共用这一张表，删除会删掉那一行。"
        : "Choose a folder. One text file is one row in lesson_chunks, kept whole. The file name is stored in source. Overwriting the text also overwrites that row's 1024 numbers. This stage keeps .txt, .md, and .markdown. The class shares this table, so delete removes that row.") + "</p>" +
      "<div class='field'><label for='apikey'>" + t.key + "</label><input id='apikey' type='password' autocomplete='off' /></div>" +
      "<div class='field'><label for='supabase-url'>" + t.project + "</label><input id='supabase-url' type='text' placeholder='https://xxxx.supabase.co' autocomplete='off' /></div>" +
      "<div class='field'><label for='publishable'>" + t.publishable + "</label><input id='publishable' type='password' autocomplete='off' /></div>" +
      "<div class='field'><label for='folder'>" + (zh ? "文件夹" : "Folder") + "</label><input id='folder' type='file' webkitdirectory directory multiple /></div>" +
      "<p class='hint'><a href='../student-db/student-db-" + (zh ? "zh" : "en") + ".zip' download>" + (zh ? "下载练习文件夹" : "Download the practice folder") + "</a>" +
      (zh ? "。解压后，用上面的按钮选中 student-db-zh。里面有十五个文本，另有一个 PDF 和一个空文件，这一页会跳过。" : ". Unzip it, then choose the folder student-db-en above. It holds fifteen text files, plus one PDF and one empty file, which this page skips.") + "</p>" +
      "<p class='hint'><a href='09-split.html'>" + (zh ? "字数、重叠、符号和其他切法在这一页。" : "Chunk size, overlap, symbols, and the other cuts are on this page.") + "</a></p>" +
      "<div id='queue' class='chunk-list'></div>" +
      "<div class='row'><button type='button' class='primary' id='write-folder'>" + (zh ? "写入这些文本" : "Write these texts") + "</button></div>" +
      "</section>" +
      "<section class='panel'>" +
      "<h2>" + (zh ? "表里的行" : "Rows in the table") + "</h2>" +
      "<div class='field'><label for='filter'>" + (zh ? "按 id 或文件名筛选" : "Filter by id or file name") + "</label><input id='filter' type='text' autocomplete='off' /></div>" +
      "<div class='row'><button type='button' id='load'>" + (zh ? "读取" : "Load") + "</button></div>" +
      "<p id='count' class='hint'></p>" +
      "<div class='row pager' id='pager'></div>" +
      "<div id='rows' class='chunk-list'></div>" +
      "<h2>" + (zh ? "选中的一行" : "Selected row") + "</h2>" +
      "<div class='field'><label for='row-id'>id</label><input id='row-id' type='text' autocomplete='off' /></div>" +
      "<div class='field'><label for='row-source'>" + (zh ? "文件名（source）" : "File name (source)") + "</label><input id='row-source' type='text' autocomplete='off' /></div>" +
      "<div class='field'><label for='md-body'>" + (zh ? "正文" : "Text") + "</label><textarea id='md-body'></textarea></div>" +
      "<div class='row'>" +
      "<button type='button' class='primary' id='save'>" + (zh ? "写入这一行" : "Write this row") + "</button>" +
      "<button type='button' id='remove'>" + (zh ? "删除" : "Remove") + "</button>" +
      "</div>" +
      "<h2>" + (zh ? "用一句话看远近" : "Check distance with one sentence") + "</h2>" +
      "<div class='field'><label for='probe'>" + (zh ? "一句话" : "One sentence") + "</label><input id='probe' type='text' autocomplete='off' /></div>" +
      "<div class='row'><button type='button' id='ask'>" + (zh ? "找最近的行" : "Find nearest rows") + "</button></div>" +
      "<div id='ranks'></div>" +
      "</section>" +
      "</div>";

    let loadedId = "";
    let loadedContent = "";
    let queue = [];
    let allRows = [];
    let page = 0;
    let total = 0;
    let totalExact = false;
    let loadedOnce = false;
    let lastContentRange = "";
    const pageSize = 10;

    function keysReady() {
      return document.getElementById("apikey").value.trim() && document.getElementById("supabase-url").value.trim() && document.getElementById("publishable").value.trim();
    }

    function ready() {
      if (!keysReady()) {
        setStatus(t.needKey, "bad");
        return false;
      }
      return true;
    }

    function projectUrl() {
      return document.getElementById("supabase-url").value.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/i, "");
    }

    function isTextName(name) {
      return /\.(txt|md|markdown)$/i.test(name);
    }

    function idFromPath(file) {
      const rel = (file.webkitRelativePath || file.name).replace(/\\/g, "/");
      return rel.replace(/\.[^./]+$/, "").trim().toLowerCase().replace(/\s+/g, "-");
    }

    async function embed(input) {
      const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + document.getElementById("apikey").value.trim()
        },
        body: JSON.stringify({ model: "qwen/qwen3-embedding-4b", input: input, dimensions: 1024 })
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok || data.error) {
        const msg = (data.error && data.error.message) || res.statusText || "request failed";
        throw new Error("HTTP " + res.status + " " + String(msg).slice(0, 180));
      }
      return data.data.slice().sort(function (a, b) { return a.index - b.index; }).map(function (row) { return row.embedding; });
    }

    async function rest(method, path, body, prefer) {
      const key = document.getElementById("publishable").value.trim();
      const headers = { apikey: key, Authorization: "Bearer " + key, Accept: "application/json" };
      if (body != null) headers["Content-Type"] = "application/json";
      if (prefer) headers.Prefer = prefer;
      const res = await fetch(projectUrl() + path, {
        method: method,
        headers: headers,
        body: body == null ? undefined : JSON.stringify(body)
      });
      const text = await res.text();
      let data = null;
      if (text) { try { data = JSON.parse(text); } catch (e) { data = text; } }
      if (!res.ok) throw new Error("HTTP " + res.status + " " + String(data && data.message ? data.message : text).slice(0, 180));
      lastContentRange = res.headers.get("content-range") || "";
      return data;
    }

    function filterTerm() {
      return document.getElementById("filter").value.trim().replace(/[^\w\u0080-\uFFFF./-]+/g, "");
    }

    function listPath() {
      let path = "/rest/v1/lesson_chunks?select=id,content,source&order=id.asc&limit=" + pageSize + "&offset=" + (page * pageSize);
      const term = filterTerm();
      if (term) path += "&or=(id.ilike.*" + encodeURIComponent(term) + "*,source.ilike.*" + encodeURIComponent(term) + "*)";
      return path;
    }

    function pageCount() {
      if (!totalExact) return allRows.length < pageSize ? page + 1 : page + 2;
      return Math.max(1, Math.ceil(total / pageSize));
    }

    function pageStatus() {
      const pages = pageCount();
      if (zh) {
        if (totalExact) return "表里 " + total + " 行。第 " + (page + 1) + " / " + pages + " 页，每页 " + pageSize + " 行。";
        return "第 " + (page + 1) + " 页，这一页 " + allRows.length + " 行。";
      }
      if (totalExact) return total + " rows. Page " + (page + 1) + " of " + pages + ", " + pageSize + " rows on a page.";
      return "Page " + (page + 1) + ", " + allRows.length + " rows on this page.";
    }

    function pageWindow() {
      const pages = totalExact ? pageCount() : 0;
      if (!pages) return [page + 1];
      if (pages <= 7) {
        const all = [];
        for (let i = 1; i <= pages; i++) all.push(i);
        return all;
      }
      const cur = page + 1;
      const set = [1];
      for (let i = cur - 1; i <= cur + 1; i++) {
        if (i > 1 && i < pages) set.push(i);
      }
      set.push(pages);
      const out = [];
      set.forEach(function (n, i) {
        if (i && n - set[i - 1] > 1) out.push("…");
        out.push(n);
      });
      return out;
    }

    function fillForm(row) {
      document.getElementById("row-id").value = row.id;
      document.getElementById("row-source").value = row.source || "";
      document.getElementById("md-body").value = row.content || "";
      loadedId = row.id;
      loadedContent = row.content || "";
      paintRows();
    }

    function paintPager() {
      const box = document.getElementById("pager");
      box.innerHTML = "";
      if (!loadedOnce || !total) return;
      const prev = document.createElement("button");
      prev.type = "button";
      prev.textContent = zh ? "上一页" : "Previous";
      prev.disabled = page === 0;
      prev.addEventListener("click", function () { goPage(page - 1); });
      box.appendChild(prev);
      pageWindow().forEach(function (n) {
        if (n === "…") {
          const gap = document.createElement("span");
          gap.className = "pager-gap";
          gap.textContent = "…";
          box.appendChild(gap);
          return;
        }
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = String(n);
        if (n === page + 1) button.className = "on";
        button.addEventListener("click", function () { goPage(n - 1); });
        box.appendChild(button);
      });
      const next = document.createElement("button");
      next.type = "button";
      next.textContent = zh ? "下一页" : "Next";
      const last = totalExact ? pageCount() - 1 : (allRows.length < pageSize ? page : page + 1);
      next.disabled = page >= last;
      next.addEventListener("click", function () { goPage(page + 1); });
      box.appendChild(next);
    }

    function paintRows() {
      const box = document.getElementById("rows");
      const count = document.getElementById("count");
      box.innerHTML = "";
      if (!loadedOnce) {
        count.textContent = "";
        box.innerHTML = "<p class='hint'>" + (zh ? "点读取。行多的时候，一页十行。" : "Click Load. A long table shows ten rows on a page.") + "</p>";
        paintPager();
        return;
      }
      count.textContent = pageStatus();
      if (!allRows.length) {
        box.innerHTML = "<p class='hint'>" + (filterTerm()
          ? (zh ? "没有对上的行。" : "No rows match.")
          : (zh ? "表是空的。" : "The table is empty.")) + "</p>";
        paintPager();
        return;
      }
      allRows.forEach(function (row) {
        const article = document.createElement("article");
        if (row.id === loadedId) article.className = "picked";
        article.innerHTML = "<span class='tag'>id · " + escapeHtml(row.id) + "</span><span class='tag'>" + escapeHtml(row.source || "") + "</span><pre>" + escapeHtml(row.content || "") + "</pre>";
        article.addEventListener("click", function () { fillForm(row); });
        box.appendChild(article);
      });
      paintPager();
    }

    async function goPage(nextPage) {
      if (nextPage < 0 || nextPage === page) return;
      if (!ready()) return;
      page = nextPage;
      setStatus(zh ? "正在读取…" : "Loading…", "");
      try {
        await loadRows();
        setStatus(pageStatus(), "ok");
      } catch (err) {
        setStatus(err.message || String(err), "bad");
      }
    }

    function paintQueue() {
      const box = document.getElementById("queue");
      box.innerHTML = "";
      if (!queue.length) {
        box.innerHTML = "<p class='hint'>" + (zh ? "还没有文件夹。" : "No folder yet.") + "</p>";
        return;
      }
      queue.forEach(function (item) {
        const article = document.createElement("article");
        if (item.skip) article.className = "skip";
        article.innerHTML = "<span class='tag'>" + escapeHtml(item.name) + "</span><span class='tag'>" +
          escapeHtml(item.skip || ("id · " + item.id)) + "</span><p class='hint'>" +
          escapeHtml(item.path) + (item.text ? " · " + item.text.length : "") + "</p>";
        box.appendChild(article);
      });
    }

    async function readQueue(fileList) {
      const files = Array.prototype.slice.call(fileList || []);
      const used = {};
      const next = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = (file.webkitRelativePath || file.name).replace(/\\/g, "/");
        if (!isTextName(file.name)) {
          next.push({ name: file.name, path: path, skip: zh ? "不是文本" : "Not text" });
          continue;
        }
        const text = await file.text();
        if (!text.trim()) {
          next.push({ name: file.name, path: path, skip: zh ? "是空的" : "Empty" });
          continue;
        }
        let id = idFromPath(file);
        if (!id) id = "file";
        const base = id;
        let n = 2;
        while (used[id]) {
          id = base + "-" + n;
          n += 1;
        }
        used[id] = true;
        next.push({ id: id, source: file.name, text: text, name: file.name, path: path, skip: "" });
      }
      return next;
    }

    async function loadRows() {
      const rows = await rest("GET", listPath(), null, "count=exact");
      allRows = Array.isArray(rows) ? rows : [];
      const match = /\/(\d+)\s*$/.exec(lastContentRange);
      if (match) {
        totalExact = true;
        total = Number(match[1]);
        const pages = Math.max(1, Math.ceil(total / pageSize));
        if (page > pages - 1) {
          page = pages - 1;
          if (total > 0) return loadRows();
        }
      } else {
        totalExact = false;
        total = allRows.length ? page * pageSize + allRows.length + (allRows.length < pageSize ? 0 : 1) : 0;
      }
      loadedOnce = true;
      paintRows();
      return allRows;
    }

    async function writeOne(id, source, content) {
      const vector = (await embed([content]))[0];
      if (!vector || vector.length !== 1024) throw new Error(zh ? "返回的长度不是 1024" : "The vector length is not 1024");
      const row = { content: content, source: source, embedding: vector };
      const updated = await rest("PATCH", "/rest/v1/lesson_chunks?id=eq." + encodeURIComponent(id), row, "return=representation");
      if (!Array.isArray(updated) || !updated.length) {
        await rest("POST", "/rest/v1/lesson_chunks", Object.assign({ id: id }, row), "return=minimal");
      }
      loadedId = id;
      loadedContent = content;
    }

    document.getElementById("folder").addEventListener("change", async function (event) {
      queue = await readQueue(event.target.files);
      paintQueue();
      const ready = queue.filter(function (item) { return !item.skip; });
      const skipped = queue.length - ready.length;
      if (!ready.length) {
        setStatus(zh ? "这个文件夹里没有可写入的文本。" : "This folder has no text to write.", "bad");
        return;
      }
      setStatus(zh
        ? "可写入 " + ready.length + " 个文本。" + (skipped ? " 跳过 " + skipped + " 个。" : "")
        : ready.length + " text files can be written." + (skipped ? " Skipped " + skipped + "." : ""), "");
    });

    document.getElementById("filter").addEventListener("input", function () {
      page = 0;
      clearTimeout(document.getElementById("filter")._timer);
      document.getElementById("filter")._timer = setTimeout(async function () {
        if (!keysReady()) return;
        try {
          await loadRows();
        } catch (err) {
          setStatus(err.message || String(err), "bad");
        }
      }, 300);
    });

    document.getElementById("write-folder").addEventListener("click", async function () {
      if (!ready()) return;
      const readyItems = queue.filter(function (item) { return !item.skip; });
      if (!readyItems.length) {
        setStatus(zh ? "先选一个含有文本的文件夹。" : "Choose a folder that contains text files.", "bad");
        return;
      }
      try {
        for (let i = 0; i < readyItems.length; i++) {
          const item = readyItems[i];
          setStatus((zh ? "正在覆盖正文和 1024 个数 " : "Overwriting text and 1024 numbers ") + (i + 1) + "/" + readyItems.length + " · " + item.name, "");
          await writeOne(item.id, item.source, item.text);
        }
        page = 0;
        await loadRows();
        setStatus(zh ? "已覆盖 " + readyItems.length + " 行的正文和 1024 个数。" : "Overwrote the text and the 1024 numbers for " + readyItems.length + " rows.", "ok");
      } catch (err) {
        setStatus(err.message || String(err), "bad");
      }
    });

    document.getElementById("load").addEventListener("click", async function () {
      if (!ready()) return;
      setStatus(zh ? "正在读取…" : "Loading…", "");
      try {
        await loadRows();
        setStatus(pageStatus(), "ok");
      } catch (err) {
        setStatus(err.message || String(err), "bad");
      }
    });

    document.getElementById("save").addEventListener("click", async function () {
      if (!ready()) return;
      try {
        const id = document.getElementById("row-id").value.trim();
        const source = document.getElementById("row-source").value.trim();
        const content = document.getElementById("md-body").value;
        if (!id || !content.trim()) {
          setStatus(zh ? "先填 id，并放上正文。" : "Enter an id and some text.", "bad");
          return;
        }
        if (!source) {
          setStatus(zh ? "先填文件名。" : "Enter the file name.", "bad");
          return;
        }
        setStatus(zh ? "正在覆盖正文和 1024 个数…" : "Overwriting the text and the 1024 numbers…", "");
        await writeOne(id, source, content);
        await loadRows();
        setStatus(zh ? "已覆盖正文和 1024 个数。" : "Overwrote the text and the 1024 numbers.", "ok");
      } catch (err) {
        setStatus(err.message || String(err), "bad");
      }
    });

    document.getElementById("remove").addEventListener("click", async function () {
      if (!ready()) return;
      const id = document.getElementById("row-id").value.trim();
      if (!id) {
        setStatus(zh ? "先填要删除的 id。" : "Enter the id to remove.", "bad");
        return;
      }
      setStatus(zh ? "正在删除…" : "Removing…", "");
      try {
        await rest("DELETE", "/rest/v1/lesson_chunks?id=eq." + encodeURIComponent(id), null, "return=minimal");
        if (loadedId === id) {
          loadedId = "";
          loadedContent = "";
          document.getElementById("md-body").value = "";
          document.getElementById("row-source").value = "";
        }
        await loadRows();
        setStatus(zh ? "已删除 " + id + "。" : "Removed " + id + ".", "ok");
      } catch (err) {
        setStatus(err.message || String(err), "bad");
      }
    });

    document.getElementById("ask").addEventListener("click", async function () {
      if (!ready()) return;
      const question = document.getElementById("probe").value.trim();
      if (!question) {
        setStatus(zh ? "先写一句话。" : "Enter one sentence.", "bad");
        return;
      }
      setStatus(zh ? "正在把这句话变成数字…" : "Turning that sentence into numbers…", "");
      try {
        const vector = (await embed([question]))[0];
        if (!vector || vector.length !== 1024) throw new Error(zh ? "返回的长度不是 1024" : "The vector length is not 1024");
        const rows = await rest("POST", "/rest/v1/rpc/match_lesson_chunks", { query_embedding: vector, match_count: 3 });
        const list = Array.isArray(rows) ? rows : [];
        document.getElementById("ranks").innerHTML = list.map(function (row, i) {
          return "<article class='" + (i === 0 ? "policy" : "") + "'><span class='tag'>id · " + escapeHtml(row.id) + " · " + Number(row.similarity).toFixed(2) + "</span><span class='tag'>" + escapeHtml(row.source || "") + "</span><p>" + escapeHtml(row.content) + "</p></article>";
        }).join("") || "<p class='hint'>—</p>";
        setStatus(list[0]
          ? (zh ? "最近的是 " : "Nearest is ") + list[0].id
          : (zh ? "库里还没有行。" : "No rows yet."),
          list[0] ? "ok" : "bad");
      } catch (err) {
        setStatus(err.message || String(err), "bad");
      }
    });

    paintQueue();
    paintRows();
  }

  function isHeading(line) {
    const t = line.trim();
    if (!t || t.length > 80) return false;
    if (/^#{1,6}\s+\S/.test(t)) return true;
    if (/^第[0-9一二三四五六七八九十百千]+[章节篇部]/.test(t)) return true;
    if (/^[一二三四五六七八九十]+、\S/.test(t)) return true;
    if (/^(chapter|section)\s+\d+/i.test(t)) return true;
    if (/^\d{1,2}[.)]\s+\S/.test(t) && t.length <= 40 && !/[。.!？?]$/.test(t)) return true;
    return false;
  }

  function splitOnSymbol(text, symbol) {
    if (!symbol) return [text];
    const parts = [];
    let start = 0;
    let at = text.indexOf(symbol, start);
    if (at === -1) {
      const only = text.trim();
      return only ? [only] : [];
    }
    while (at !== -1) {
      const end = at + symbol.length;
      const piece = text.slice(start, end).replace(/^[ \t]+/, "").replace(/[ \t]+$/, "");
      if (piece.trim()) parts.push(piece);
      start = end;
      at = text.indexOf(symbol, start);
    }
    const tail = text.slice(start).replace(/^[ \t]+/, "").replace(/\s+$/, "");
    if (tail.trim()) parts.push(tail);
    return parts.length ? parts : [text.trim()];
  }

  function lastBreak(window) {
    const marks = ["\n\n", "\n", "。", "！", "？", ". ", "! ", "? ", "，", ", "];
    let best = -1;
    marks.forEach(function (mark) {
      const at = window.lastIndexOf(mark);
      if (at > best) best = at + mark.length;
    });
    return best;
  }

  function hardCut(text, max) {
    const out = [];
    const n = Math.max(8, max);
    for (let i = 0; i < text.length; i += n) out.push(text.slice(i, i + n));
    return out.length ? out : [text];
  }

  function splitBySize(text, max) {
    const clean = text.trim();
    if (!clean) return [];
    if (clean.length <= max) return [clean];
    const out = [];
    let i = 0;
    while (i < clean.length) {
      let end = Math.min(clean.length, i + max);
      if (end < clean.length) {
        const breakAt = lastBreak(clean.slice(i, end));
        if (breakAt > Math.floor(max * 0.4)) end = i + breakAt;
      }
      const slice = clean.slice(i, end).trim();
      if (slice) out.push(slice);
      if (end >= clean.length) break;
      let next = end;
      while (next < clean.length && /\s/.test(clean.charAt(next))) next += 1;
      if (next <= i) next = Math.min(clean.length, i + Math.max(1, max));
      if (next <= i) break;
      i = next;
    }
    return out.length ? out : [clean];
  }

  function sentencesOf(text) {
    const parts = text.split(/(?<=[。！？!?])\s*|(?<=\.)\s+/).map(function (part) { return part.trim(); }).filter(Boolean);
    return parts.length ? parts : [text];
  }

  function joinSents(list) {
    return list.reduce(function (acc, part) {
      if (!acc) return part;
      if (/[。！？!?]$/.test(acc) && /^[A-Za-z]/.test(part)) return acc + " " + part;
      if (/[。！？!?]$/.test(acc)) return acc + part;
      return acc + " " + part;
    }, "");
  }

  function packPieces(pieces, max, sep) {
    const out = [];
    let buf = "";
    pieces.forEach(function (piece) {
      if (!piece) return;
      if (piece.length > max) {
        if (buf) { out.push(buf); buf = ""; }
        splitBySize(piece, max).forEach(function (part) { out.push(part); });
        return;
      }
      const next = !buf ? piece : (sep != null ? buf + sep + piece : joinSents([buf, piece]));
      if (!buf || next.length <= max) buf = next;
      else { out.push(buf); buf = piece; }
    });
    if (buf) out.push(buf);
    return out.length ? out : pieces;
  }

  function headingPieces(text, max, keepTitle) {
    const lines = text.split("\n");
    const blocks = [];
    let cur = [];
    lines.forEach(function (line) {
      if (isHeading(line) && cur.some(function (row) { return row.trim(); })) {
        const joined = cur.join("\n").trim();
        if (joined) blocks.push(joined);
        cur = [line];
      } else cur.push(line);
    });
    const tail = cur.join("\n").trim();
    if (tail) blocks.push(tail);
    const out = [];
    (blocks.length ? blocks : [text]).forEach(function (block) {
      if (block.length <= max) { out.push(block); return; }
      const head = block.split("\n")[0];
      const titled = keepTitle && isHeading(head);
      splitBySize(block, max).forEach(function (part, index) {
        if (titled && index > 0 && part.indexOf(head) !== 0) out.push(head + "\n" + part);
        else out.push(part);
      });
    });
    return out;
  }

  function recursiveSplit(text, max) {
    const seps = ["\n\n", "\n", "。", "！", "？", ". ", "! ", "? ", "，", ", ", " "];
    function walk(value, level) {
      const clean = value.trim();
      if (!clean) return [];
      if (clean.length <= max || level >= seps.length) {
        if (clean.length <= max) return [clean];
        return hardCut(clean, max);
      }
      const sep = seps[level];
      if (clean.indexOf(sep) === -1) return walk(clean, level + 1);
      const bits = splitOnSymbol(clean, sep);
      if (bits.length <= 1) return walk(clean, level + 1);
      const packed = [];
      let buf = "";
      bits.forEach(function (bit) {
        if (bit.length > max) {
          if (buf) { packed.push(buf.trim()); buf = ""; }
          walk(bit, level + 1).forEach(function (part) { packed.push(part); });
          return;
        }
        if (!buf) { buf = bit; return; }
        if ((buf + bit).length <= max) buf += bit;
        else { packed.push(buf.trim()); buf = bit; }
      });
      if (buf.trim()) packed.push(buf.trim());
      return packed;
    }
    const out = walk(text, 0);
    return out.length ? out : [text];
  }

  function qaPieces(text) {
    const lines = text.split("\n");
    const blocks = [];
    let cur = [];
    let saw = false;
    lines.forEach(function (line) {
      if (/^(?:问|問|q)\s*[:：]/i.test(line.trim())) {
        saw = true;
        const joined = cur.join("\n").trim();
        if (joined) blocks.push(joined);
        cur = [line];
      } else cur.push(line);
    });
    const tail = cur.join("\n").trim();
    if (tail) blocks.push(tail);
    return { pieces: blocks.filter(Boolean), saw: saw };
  }

  function windowChunks(text, k) {
    const sents = sentencesOf(text);
    const out = [];
    for (let i = 0; i < sents.length; i += 1) {
      const slice = sents.slice(i, i + k);
      if (!slice.length) break;
      const shared = i > 0 ? joinSents(sents.slice(i, Math.min(sents.length, i + k - 1))) : "";
      out.push({ text: joinSents(slice), overlap: shared && joinSents(slice).indexOf(shared) === 0 ? shared : "" });
      if (i + k >= sents.length) break;
    }
    return out.length ? out : [{ text: text, overlap: "" }];
  }

  function sentenceTail(prev) {
    const parts = prev.split(/(?<=[。！？!?])\s*|(?<=\.)\s+/).map(function (part) { return part.trim(); }).filter(Boolean);
    if (!parts.length) return "";
    const last = parts[parts.length - 1];
    if (last.length > 180) return last.slice(-180);
    return last;
  }

  function applyOverlap(pieces, kind, n) {
    return pieces.map(function (piece, index) {
      if (index === 0 || kind === "none") return { text: piece, overlap: "" };
      const prev = pieces[index - 1];
      let extra = "";
      if (kind === "sentence") extra = sentenceTail(prev);
      else if (kind === "chars") extra = prev.slice(Math.max(0, prev.length - Math.min(n, Math.max(1, prev.length - 1))));
      else if (kind === "ratio") {
        const count = Math.min(prev.length - 1, Math.max(1, Math.round(prev.length * n / 100)));
        extra = prev.slice(prev.length - count);
      }
      if (!extra) return { text: piece, overlap: "" };
      if (piece.indexOf(extra) === 0) return { text: piece, overlap: extra };
      const glued = extra + "\n" + piece;
      return { text: glued, overlap: extra + "\n" };
    });
  }


  if (demo === "split") {
    const sampleText = zh
      ? "# 年假\n\n教职员请于出发前十个工作日在门户提交年假申请。申请须写明出发日和返回日。部门主管在三个工作日内批复。未批复前不得离岗。\n\n批假之后，职员须在系统里填写实际出发日期。返回后五个工作日内补交行程。逾期未补的，年假天数按未休处理。\n\n# 过敏\n\n教职员如对花生过敏，须在入职表上登记。食堂不提供花生酱。自带食物请标明成分。\n\n医务室备有抗组胺药。严重反应先拨校内急救，再通知部门。\n\n# 广告\n\n暑假旅游，立即预订。此段不是规章，用来对照检索。\n\n# 校园交通\n\n校巴于上课日七时从地铁站开出，每二十分钟一班，末班二十一时。周末首班九时，末班十八时。校巴不载大型行李。雨天仍按时刻表行驶。\n\n# 图书馆\n\n图书馆开放时间为八时至二十二时。考试周延长到二十三时。借书上限十册，期限十四日。逾期每天每册一元。丢失按原价两倍赔偿。\n\n# 打印\n\n每名学生每学期有一百页免费打印。超出部分每页两角。彩色打印不在免费额度内。卡纸请到服务台处理，不要自行拆机。\n\n# 诊所\n\n校诊所工作日九时至十七时。急症请到附近医院。就诊须带学生证。\n\n# 宿舍\n\n门禁二十三时。访客须在前台登记，最迟二十二时离开。宿舍不可以使用电热炉。\n\n# 考试\n\n考试周禁止在课室饮食。迟到三十分钟不得入场。手机放在指定袋内。\n\n# 无线网络\n\n校园网账号是学生编号。密码每九十天更换。访客网每天申请一次，当日有效。"
      : "# Leave\n\nApply ten working days before you travel. Write the departure date and the return date. A head of department replies within three working days. Do not leave before that reply.\n\nAfter approval, enter the real departure date. File the trip within five working days of your return.\n\n# Allergy\n\nStaff who are allergic to peanuts register it on the joining form. The canteen does not serve peanut butter. Label food you bring in.\n\n# Advert\n\nSummer trip, book now. This line is not a rule. It is here so a search can miss it.\n\n# Shuttle\n\nOn class days the shuttle leaves the metro at 07:00, every twenty minutes, last bus 21:00. Weekends start at 09:00 and end at 18:00. Large luggage stays off the bus.\n\n# Library\n\nThe library is open from 08:00 to 22:00. Exam weeks close at 23:00. The loan limit is ten books for fourteen days.\n\n# Printer\n\nEach student has one hundred free pages a term. Extra pages cost twenty cents. Colour printing is not included.\n\n# Clinic\n\nThe campus clinic is open on weekdays from 09:00 to 17:00. Bring a student card.\n\n# Dorm\n\nThe gate closes at 23:00. Visitors sign in and leave by 22:00. Hot plates are not allowed.\n\n# Exam\n\nNo food in the exam room. Arrival after thirty minutes means you cannot sit the paper. Phones go in the marked bag.\n\n# Wifi\n\nThe campus account is the student number. The password changes every ninety days. Guest wifi lasts one day.";

    const qaText = zh
      ? "问：怎么请假？\n答：教职员请于出发前十个工作日在门户提交年假申请。未批复前不得离岗。\n\n问：我对什么过敏？\n答：花生过敏须在入职表上登记。食堂不提供花生酱。\n\n问：校巴末班是几点？\n答：上课日末班二十一时。周末末班十八时。\n\n问：暑假去哪？\n答：暑假旅游，立即预订。此段不是规章。"
      : "Q: How do I apply for leave?\nA: Apply ten working days before you travel. Do not leave before the reply.\n\nQ: What am I allergic to?\nA: Register a peanut allergy on the joining form. The canteen does not serve peanut butter.\n\nQ: When is the last shuttle?\nA: On class days the last bus is 21:00. On weekends it is 18:00.\n\nQ: Where is the summer trip?\nA: Summer trip, book now. This line is not a rule.";

    const methodList = zh
      ? [["whole", "整篇", "whole"], ["hard", "硬切", "hard cut"], ["size", "按字数", "by length"], ["symbol", "按符号", "by symbol"], ["sentence", "按句子", "by sentence"], ["paragraph", "按空行", "by paragraph"], ["heading", "按标题", "by heading"], ["recursive", "递归", "recursive"], ["qa", "问答对", "Q&A"], ["window", "句子窗口", "sentence window"]]
      : [["whole", "Whole"], ["hard", "Hard cut"], ["size", "By length"], ["symbol", "By symbol"], ["sentence", "Sentences"], ["paragraph", "Blank lines"], ["heading", "Headings"], ["recursive", "Recursive"], ["qa", "Q&A"], ["window", "Window"]];
    const overlapList = zh
      ? [["none", "不重叠", "no overlap"], ["sentence", "上一句", "last sentence"], ["chars", "固定字数", "fixed characters"], ["ratio", "百分比", "percent"]]
      : [["none", "None"], ["sentence", "Last sentence"], ["chars", "Characters"], ["ratio", "Percent"]];
    const symbolPresets = zh
      ? [["。", "。"], ["！", "！"], ["？", "？"], ["，", "，"], ["空行", "\\n\\n"], ["换行", "\\n"]]
      : [[". ", ". "], ["! ", "! "], ["? ", "? "], [", ", ", "], ["Blank line", "\\n\\n"], ["Newline", "\\n"]];

    app.innerHTML =
      "<p id='status'></p>" +
      "<div class='columns'>" +
      "<section class='panel'>" +
      "<h2>" + (zh ? "原文" : "Source") + "</h2>" +
      "<div class='field'><label for='src'>" + (zh ? "文本文件" : "Text file") + "</label><input id='src' type='file' accept='.txt,.md,.markdown,text/plain' /></div>" +
      "<div class='field'><label for='body'>" + (zh ? "或粘贴全文" : "Or paste the whole text") + "</label><textarea id='body' class='tall'></textarea></div>" +
      "<div class='row'><button type='button' id='sample'>" + (zh ? "填入课文" : "Fill the handbook") + "</button><button type='button' id='sample-qa'>" + (zh ? "填入问答" : "Fill questions") + "</button></div>" +
      "<h2>" + (zh ? "怎么切" : "How to cut") + "</h2>" +
      "<div class='row methods' id='methods'>" + methodList.map(function (item) {
        return termButton("mode", item);
      }).join("") + "</div>" +
      "<p id='why' class='hint'></p>" +
      "<div class='field only' id='size-row'><label for='max'>" + (zh ? "一块最多多少字 chunk size" : "Most characters in one chunk") + "</label><input id='max' type='number' min='8' value='80' /></div>" +
      "<div class='field only' id='overlap-row'><label>" + (zh ? "重叠 overlap" : "Overlap") + "</label><div class='row methods' id='overlap-kinds'>" + overlapList.map(function (item) {
        return termButton("overlap", item);
      }).join("") + "</div></div>" +
      "<div class='field only' id='amount-row'><label for='amount'>" + (zh ? "重叠多少字" : "Overlap characters") + "</label><input id='amount' type='number' min='1' value='20' /></div>" +
      "<div class='field only' id='symbol-row'><label for='symbol'>" + (zh ? "遇到这个符号就切。换行用下面的按钮。" : "Cut at this symbol. Newlines are the buttons below.") + "</label><input id='symbol' type='text' value='" + (zh ? "。" : ". ") + "' autocomplete='off' /><div class='row methods' id='symbol-presets'>" + symbolPresets.map(function (item) {
        return "<button type='button' data-symbol='" + escapeHtml(item[1]) + "'>" + escapeHtml(item[0]) + "</button>";
      }).join("") + "</div></div>" +
      "<div class='field only' id='window-row'><label for='window-n'>" + (zh ? "每块几句 sentence window" : "Sentences in one chunk") + "</label><input id='window-n' type='number' min='1' max='8' value='2' /></div>" +
      "<div class='field'><label for='gate'>" + (zh ? "门槛 gate。短于多少字就整篇一块。0 表示总是切。" : "Shorter than this stays one chunk. 0 always cuts.") + "</label><input id='gate' type='number' min='0' value='0' /></div>" +
      "<label class='check only' id='title-row'><input id='keep-title' type='checkbox' />" + (zh ? "标题写进被切开的每一块" : "Copy the heading into every piece of that section") + "</label>" +
      "<div class='field'><label for='stem'>" + (zh ? "文件夹名" : "Folder name") + "</label><input id='stem' type='text' value='chunks' autocomplete='off' /></div>" +
      "<div class='row'><button type='button' class='primary' id='open-preview' disabled>" + (zh ? "预览" : "Preview") + "</button></div>" +
      "<p class='hint'>" + (zh ? "右边先点中一份。这一颗按钮才展开那一份全文。" : "Pick one file on the right. This button opens that file.") + "</p>" +
      "<p class='hint'><a href='08-manage.html'>" + (zh ? "打开管理向量库" : "Open the vector store") + "</a>" +
      (zh ? "。解压后选中文件夹。一个文件是一行。" : ". After unzipping, choose the folder. One file is one row.") + "</p>" +
      "<p class='hint'><a href='10-methods.html'>" + (zh ? "每一种切法的逐步说明。" : "How each cut works, step by step.") + "</a></p>" +
      "</section>" +
      "<section class='panel'>" +
      "<h2>" + (zh ? "预览" : "Preview") + "</h2>" +
      "<p id='summary' class='hint'></p>" +
      "<div class='preview-split'>" +
      "<div id='queue' class='chunk-list'></div>" +
      "<div id='preview'>" +
      "<p id='preview-name' class='hint'></p>" +
      "<div class='row'><button type='button' id='prev-file'>" + (zh ? "上一份" : "Previous") + "</button><button type='button' id='next-file'>" + (zh ? "下一份" : "Next") + "</button><button type='button' id='close-preview'>" + (zh ? "收起" : "Hide") + "</button></div>" +
      "<pre id='preview-body' class='closed'></pre>" +
      "<div class='row'><button type='button' class='primary' id='download' disabled>" + (zh ? "下载 zip" : "Download zip") + "</button></div>" +
      "</div>" +
      "</div>" +
      "</section>" +
      "</div>";

    let files = [];
    let previewIndex = 0;
    let previewOpen = false;
    let lastSaw = true;
    let currentMode = "size";
    let overlapKind = "sentence";

    function maxChars() {
      const n = Number(document.getElementById("max").value);
      if (!Number.isFinite(n) || n < 8) return 80;
      return Math.floor(n);
    }

    function amount() {
      const n = Number(document.getElementById("amount").value);
      if (!Number.isFinite(n) || n < 1) return 20;
      if (overlapKind === "ratio") return Math.min(90, Math.floor(n));
      return Math.floor(n);
    }

    function windowN() {
      const n = Number(document.getElementById("window-n").value);
      if (!Number.isFinite(n) || n < 1) return 2;
      return Math.min(8, Math.floor(n));
    }

    function gateN() {
      const n = Number(document.getElementById("gate").value);
      if (!Number.isFinite(n) || n < 1) return 0;
      return Math.floor(n);
    }

    function readSymbol() {
      return document.getElementById("symbol").value.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    }

    function safeStem(raw) {
      const s = String(raw || "chunks").trim().toLowerCase().replace(/\s+/g, "-").replace(/[\\/:*?"<>|]/g, "").replace(/^\.+/, "").slice(0, 40);
      return s || "chunks";
    }

    function normalize(text) {
      return String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    }

    function shownSymbol(symbol) {
      if (!symbol) return zh ? "（空）" : "(empty)";
      return symbol.replace(/\n/g, "\\n");
    }

    function explain(sawQa) {
      const n = maxChars();
      let line = "";
      if (zh) {
        if (currentMode === "whole") line = "整篇一块。字数再长也只有一个向量。";
        else if (currentMode === "hard") line = "每 " + n + " 个字切一刀，不管句号。一句话会被从中间切开。";
        else if (currentMode === "size") line = "一块最多 " + n + " 个字，尽量在句号或换行处收刀。";
        else if (currentMode === "symbol") line = "一遇到「" + shownSymbol(readSymbol()) + "」就切开。符号留在上一块末尾。";
        else if (currentMode === "sentence") line = "先按句号切开，再把几句合成一块，直到写满 " + n + " 个字。";
        else if (currentMode === "paragraph") line = "空行是边界。短段合成一块，直到写满 " + n + " 个字。";
        else if (currentMode === "heading") line = "一个标题一块。超过 " + n + " 个字才再切。" + (document.getElementById("keep-title").checked ? " 切开之后，标题会再写进每一块。" : "");
        else if (currentMode === "recursive") line = "先试空行。还长过 " + n + " 个字，就改试换行，再试句号，最后才按字硬切。";
        else if (currentMode === "qa") line = sawQa ? "「问：」或「Q:」开头的是新的一块，回答跟在这个问题后面。这一刀不抄重叠。" : "这篇里没有「问：」或「Q:」。点填入问答。";
        else if (currentMode === "window") line = "每块 " + windowN() + " 句。下一块丢掉最旧的一句、补上新的一句，相邻两块因此重叠。";
        if (currentMode !== "whole" && currentMode !== "window" && currentMode !== "qa") {
          if (overlapKind === "none") line += " 没有重叠。";
          else if (overlapKind === "sentence") line += " 琥珀色是从上一块抄来的最后一句。";
          else if (overlapKind === "chars") line += " 琥珀色是上一块末尾的 " + amount() + " 个字。";
          else if (overlapKind === "ratio") line += " 琥珀色是上一块末尾的 " + amount() + "%。";
        }
        if (gateN() > 0) line += " 全文不超过 " + gateN() + " 个字时，保持整篇。";
      } else {
        if (currentMode === "whole") line = "The whole text is one chunk, and one vector.";
        else if (currentMode === "hard") line = "Cut every " + n + " characters, even in the middle of a sentence.";
        else if (currentMode === "size") line = "One chunk holds at most " + n + " characters, and prefers to stop at a sentence or a line.";
        else if (currentMode === "symbol") line = "Cut at “" + shownSymbol(readSymbol()) + "”. The symbol stays on the previous chunk.";
        else if (currentMode === "sentence") line = "Split on sentence marks, then pack sentences until " + n + " characters.";
        else if (currentMode === "paragraph") line = "A blank line is a boundary. Short paragraphs pack until " + n + " characters.";
        else if (currentMode === "heading") line = "One heading is one chunk, until it passes " + n + " characters." + (document.getElementById("keep-title").checked ? " The heading is copied onto every piece." : "");
        else if (currentMode === "recursive") line = "Try a blank line. If a piece is still over " + n + " characters, try a newline, then a sentence mark, then a hard cut.";
        else if (currentMode === "qa") line = sawQa ? "A line starting with Q: starts a chunk. The answer stays with that question. This cut does not copy overlap." : "This text has no Q: line. Fill the questions.";
        else if (currentMode === "window") line = "Each chunk holds " + windowN() + " sentences. The next chunk drops the oldest sentence and adds one, so neighbours overlap.";
        if (currentMode !== "whole" && currentMode !== "window" && currentMode !== "qa") {
          if (overlapKind === "none") line += " No overlap.";
          else if (overlapKind === "sentence") line += " Amber is the previous chunk’s last sentence, copied forward.";
          else if (overlapKind === "chars") line += " Amber is the last " + amount() + " characters of the previous chunk.";
          else if (overlapKind === "ratio") line += " Amber is the last " + amount() + "% of the previous chunk.";
        }
        if (gateN() > 0) line += " A text of at most " + gateN() + " characters stays one chunk.";
      }
      return line;
    }

    function fileSlug(text, n, overlap) {
      let body = text;
      if (overlap && text.indexOf(overlap) === 0) body = text.slice(overlap.length).trim();
      const first = (body.split("\n").find(function (line) { return line.trim(); }) || "").trim().replace(/^#{1,6}\s*/, "");
      let slug = first.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u3400-\u9fff-]+/g, "");
      slug = slug.replace(/^-+|-+$/g, "").slice(0, 20);
      const num = String(n).padStart(3, "0");
      return (slug ? num + "-" + slug : num) + ".txt";
    }

    function paintBody(text, overlap) {
      if (overlap && text.indexOf(overlap) === 0) {
        return "<mark class='overlap'>" + escapeHtml(overlap) + "</mark>" + escapeHtml(text.slice(overlap.length));
      }
      return escapeHtml(text);
    }

    function rowLine(file) {
      let body = file.text;
      if (file.overlap && body.indexOf(file.overlap) === 0) body = body.slice(file.overlap.length);
      const line = (body.split("\n").find(function (row) { return row.trim(); }) || "").trim();
      return line.length > 42 ? line.slice(0, 42) + "…" : line;
    }

    function paintFiles(sawQa) {
      lastSaw = sawQa;
      const box = document.getElementById("queue");
      const summary = document.getElementById("summary");
      const button = document.getElementById("download");
      const name = document.getElementById("preview-name");
      const body = document.getElementById("preview-body");
      box.innerHTML = "";
      button.disabled = !files.length;
      document.getElementById("why").textContent = explain(sawQa);
      document.getElementById("prev-file").disabled = !previewOpen || previewIndex <= 0;
      document.getElementById("next-file").disabled = !previewOpen || !files.length || previewIndex >= files.length - 1;
      document.getElementById("close-preview").disabled = !previewOpen;
      document.getElementById("open-preview").disabled = !files.length;
      if (!files.length) {
        previewOpen = false;
        summary.textContent = zh ? "还没有切。" : "Nothing cut yet.";
        name.textContent = "";
        body.className = "closed";
        body.textContent = zh ? "还没有可以预览的文件。" : "Nothing to preview yet.";
        return;
      }
      if (previewIndex < 0 || previewIndex >= files.length) previewIndex = 0;
      const longest = files.reduce(function (n, file) { return Math.max(n, file.text.length); }, 0);
      const overlapChars = files.reduce(function (n, file) { return n + file.overlap.length; }, 0);
      summary.innerHTML = "<span class='swatch'></span>" + (zh
        ? files.length + " 个文件。先点中一份，再点左边的「预览」。最长 " + longest + " 字。重叠一共 " + overlapChars + " 字。"
        : files.length + " files. Pick one, then press Preview on the left. Longest is " + longest + " characters. Overlap copies " + overlapChars + " characters.");
      files.forEach(function (file, index) {
        const article = document.createElement("article");
        article.className = index === previewIndex ? "picked" : "";
        article.innerHTML = "<span class='tag'>" + escapeHtml(file.name) + "</span><span class='tag'>" +
          file.text.length + (zh ? " 字" : " chars") + "</span><p class='hint'>" + escapeHtml(rowLine(file)) + "</p>";
        box.appendChild(article);
      });
      if (!previewOpen) {
        name.textContent = "";
        body.className = "closed";
        body.textContent = zh ? "全文先藏着。点左边的「预览」。" : "The full text stays hidden. Press Preview on the left.";
        return;
      }
      const open = files[previewIndex];
      name.textContent = open.name + " · " + open.text.length + (zh ? " 字" : " chars");
      body.className = "";
      body.innerHTML = paintBody(open.text, open.overlap);
      const picked = box.children[previewIndex];
      if (picked && picked.scrollIntoView) picked.scrollIntoView({ block: "nearest" });
    }

    function produce(text) {
      const gate = gateN();
      if (gate > 0 && text.length <= gate) return { pieces: [{ text: text, overlap: "" }], saw: true };
      if (currentMode === "window") return { pieces: windowChunks(text, windowN()), saw: true };
      let pieces = [text];
      let saw = true;
      if (currentMode === "hard") pieces = hardCut(text, maxChars());
      else if (currentMode === "size") pieces = splitBySize(text, maxChars());
      else if (currentMode === "symbol") pieces = splitOnSymbol(text, readSymbol());
      else if (currentMode === "sentence") pieces = packPieces(sentencesOf(text), maxChars());
      else if (currentMode === "paragraph") pieces = packPieces(text.split(/\n\s*\n+/).map(function (part) { return part.trim(); }).filter(Boolean), maxChars(), "\n\n");
      else if (currentMode === "heading") pieces = headingPieces(text, maxChars(), document.getElementById("keep-title").checked);
      else if (currentMode === "recursive") pieces = recursiveSplit(text, maxChars());
      else if (currentMode === "qa") {
        const found = qaPieces(text);
        pieces = found.pieces.length ? found.pieces : [text];
        saw = found.saw;
      }
      const kind = currentMode === "whole" || currentMode === "qa" ? "none" : overlapKind;
      return { pieces: applyOverlap(pieces, kind, amount()), saw: saw };
    }

    function cutNow() {
      const text = normalize(document.getElementById("body").value);
      if (!text) {
        files = [];
        previewIndex = 0;
        previewOpen = false;
        paintFiles(false);
        setStatus(zh ? "先粘贴或选择一篇 txt。" : "Paste a txt, or choose a file.", "bad");
        return;
      }
      const made = produce(text);
      previewOpen = false;
      previewIndex = files.length ? Math.min(previewIndex, made.pieces.length - 1) : 0;
      if (previewIndex < 0) previewIndex = 0;
      files = made.pieces.map(function (piece, index) {
        return {
          name: fileSlug(piece.text, index + 1, piece.overlap),
          text: piece.text,
          overlap: piece.overlap || ""
        };
      });
      paintFiles(made.saw);
      setStatus(zh ? "切成 " + files.length + " 块。" : "Cut into " + files.length + " chunks.", "ok");
    }

    function showMode(mode) {
      currentMode = mode;
      document.querySelectorAll("#methods button").forEach(function (button) {
        button.classList.toggle("on", button.dataset.mode === mode);
      });
      document.getElementById("size-row").classList.toggle("show", mode !== "whole" && mode !== "window");
      document.getElementById("overlap-row").classList.toggle("show", mode !== "whole" && mode !== "window" && mode !== "qa");
      document.getElementById("symbol-row").classList.toggle("show", mode === "symbol");
      document.getElementById("window-row").classList.toggle("show", mode === "window");
      document.getElementById("title-row").classList.toggle("show", mode === "heading");
      document.getElementById("amount-row").classList.toggle("show", mode !== "whole" && mode !== "window" && mode !== "qa" && (overlapKind === "chars" || overlapKind === "ratio"));
      cutNow();
    }

    function showOverlap(kind) {
      overlapKind = kind;
      document.querySelectorAll("#overlap-kinds button").forEach(function (button) {
        button.classList.toggle("on", button.dataset.overlap === kind);
      });
      const label = document.querySelector("label[for='amount']");
      if (label) label.textContent = kind === "ratio" ? (zh ? "重叠百分之几" : "Overlap percent") : (zh ? "重叠多少字" : "Overlap characters");
      document.getElementById("amount-row").classList.toggle("show", currentMode !== "whole" && currentMode !== "window" && currentMode !== "qa" && (kind === "chars" || kind === "ratio"));
      cutNow();
    }

    function crc32(bytes) {
      if (!crc32.table) {
        const table = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
          let c = n;
          for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
          table[n] = c >>> 0;
        }
        crc32.table = table;
      }
      let crc = 0xffffffff;
      for (let i = 0; i < bytes.length; i++) crc = crc32.table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
      return (crc ^ 0xffffffff) >>> 0;
    }

    function zipStored(entries) {
      const enc = new TextEncoder();
      const parts = [];
      const central = [];
      let offset = 0;
      entries.forEach(function (entry) {
        const nameBytes = enc.encode(entry.name);
        const data = enc.encode(entry.text);
        const crc = crc32(data);
        const local = new Uint8Array(30 + nameBytes.length);
        const view = new DataView(local.buffer);
        view.setUint32(0, 0x04034b50, true);
        view.setUint16(4, 20, true);
        view.setUint16(6, 0x0800, true);
        view.setUint16(8, 0, true);
        view.setUint32(14, crc, true);
        view.setUint32(18, data.length, true);
        view.setUint32(22, data.length, true);
        view.setUint16(26, nameBytes.length, true);
        local.set(nameBytes, 30);
        parts.push(local, data);
        const cen = new Uint8Array(46 + nameBytes.length);
        const cv = new DataView(cen.buffer);
        cv.setUint32(0, 0x02014b50, true);
        cv.setUint16(4, 20, true);
        cv.setUint16(6, 20, true);
        cv.setUint16(8, 0x0800, true);
        cv.setUint32(16, crc, true);
        cv.setUint32(20, data.length, true);
        cv.setUint32(24, data.length, true);
        cv.setUint16(28, nameBytes.length, true);
        cv.setUint32(42, offset, true);
        cen.set(nameBytes, 46);
        central.push(cen);
        offset += local.length + data.length;
      });
      let centralSize = 0;
      central.forEach(function (part) { centralSize += part.length; });
      const end = new Uint8Array(22);
      const ev = new DataView(end.buffer);
      ev.setUint32(0, 0x06054b50, true);
      ev.setUint16(8, entries.length, true);
      ev.setUint16(10, entries.length, true);
      ev.setUint32(12, centralSize, true);
      ev.setUint32(16, offset, true);
      return new Blob(parts.concat(central, [end]), { type: "application/zip" });
    }

    document.getElementById("methods").addEventListener("click", function (event) {
      const button = event.target.closest("button");
      if (!button || !button.dataset.mode) return;
      showMode(button.dataset.mode);
    });

    document.getElementById("overlap-kinds").addEventListener("click", function (event) {
      const button = event.target.closest("button");
      if (!button || !button.dataset.overlap) return;
      showOverlap(button.dataset.overlap);
    });

    document.getElementById("symbol-presets").addEventListener("click", function (event) {
      const button = event.target.closest("button");
      if (!button || button.dataset.symbol == null) return;
      document.getElementById("symbol").value = button.dataset.symbol;
      cutNow();
    });

    ["max", "amount", "gate", "window-n", "symbol"].forEach(function (id) {
      document.getElementById(id).addEventListener("input", cutNow);
    });

    document.getElementById("keep-title").addEventListener("change", cutNow);

    let typing = 0;
    document.getElementById("body").addEventListener("input", function () {
      clearTimeout(typing);
      typing = setTimeout(cutNow, 200);
    });

    document.getElementById("sample").addEventListener("click", function () {
      document.getElementById("body").value = sampleText;
      document.getElementById("stem").value = "handbook";
      cutNow();
    });

    document.getElementById("sample-qa").addEventListener("click", function () {
      document.getElementById("body").value = qaText;
      document.getElementById("stem").value = "questions";
      showMode("qa");
    });

    document.getElementById("src").addEventListener("change", async function (event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      document.getElementById("body").value = await file.text();
      const stem = file.name.replace(/\.[^.]+$/, "");
      if (stem) document.getElementById("stem").value = stem;
      cutNow();
    });

    document.getElementById("queue").addEventListener("click", function (event) {
      const article = event.target.closest("article");
      if (!article || article.parentElement.id !== "queue") return;
      const index = Array.prototype.indexOf.call(article.parentElement.children, article);
      if (index < 0) return;
      previewIndex = index;
      paintFiles(lastSaw);
    });

    document.getElementById("open-preview").addEventListener("click", function () {
      if (!files.length) return;
      previewOpen = true;
      paintFiles(lastSaw);
    });

    document.getElementById("prev-file").addEventListener("click", function () {
      if (!previewOpen || previewIndex <= 0) return;
      previewIndex -= 1;
      paintFiles(lastSaw);
    });

    document.getElementById("next-file").addEventListener("click", function () {
      if (!previewOpen || previewIndex >= files.length - 1) return;
      previewIndex += 1;
      paintFiles(lastSaw);
    });

    document.getElementById("close-preview").addEventListener("click", function () {
      previewOpen = false;
      paintFiles(lastSaw);
    });

    document.getElementById("download").addEventListener("click", function () {
      if (!files.length) return;
      const stem = safeStem(document.getElementById("stem").value);
      const blob = zipStored(files);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = stem + ".zip";
      link.click();
      URL.revokeObjectURL(url);
      setStatus(zh ? "已下载 " + stem + ".zip。解压后到管理页选中 " + stem + "。" : "Downloaded " + stem + ".zip. Unzip it, then choose " + stem + " on the manage page.", "ok");
    });

    document.getElementById("body").value = sampleText;
    document.getElementById("stem").value = "handbook";
    showOverlap("sentence");
    showMode("size");
  }

  if (demo === "methods") {
    const book = zh
      ? "# 年假\n\n教职员请于出发前十个工作日在门户提交年假申请。申请须写明出发日和返回日。部门主管在三个工作日内批复。未批复前不得离岗。\n\n批假之后，职员须在系统里填写实际出发日期。返回后五个工作日内补交行程。逾期未补的，年假天数按未休处理。\n\n# 过敏\n\n教职员如对花生过敏，须在入职表上登记。食堂不提供花生酱。自带食物请标明成分。\n\n医务室备有抗组胺药。严重反应先拨校内急救，再通知部门。\n\n# 广告\n\n暑假旅游，立即预订。此段不是规章，用来对照检索。"
      : "# Leave\n\nApply ten working days before you travel. Write the departure date and the return date. A head of department replies within three working days. Do not leave before that reply.\n\nAfter approval, enter the real departure date. File the trip within five working days of your return.\n\n# Allergy\n\nStaff who are allergic to peanuts register it on the joining form. The canteen does not serve peanut butter. Label food you bring in.\n\n# Advert\n\nSummer trip, book now. This line is not a rule. It is here so a search can miss it.";
    const questions = zh
      ? "问：怎么请假？\n答：教职员请于出发前十个工作日在门户提交年假申请。未批复前不得离岗。\n\n问：我对什么过敏？\n答：花生过敏须在入职表上登记。食堂不提供花生酱。\n\n问：校巴末班是几点？\n答：上课日末班二十一时。周末末班十八时。\n\n问：暑假去哪？\n答：暑假旅游，立即预订。此段不是规章。"
      : "Q: How do I apply for leave?\nA: Apply ten working days before you travel. Do not leave before the reply.\n\nQ: What am I allergic to?\nA: Register a peanut allergy on the joining form. The canteen does not serve peanut butter.\n\nQ: When is the last shuttle?\nA: On class days the last bus is 21:00. On weekends it is 18:00.\n\nQ: Where is the summer trip?\nA: Summer trip, book now. This line is not a rule.";
    const methodList = zh
      ? [["whole", "整篇", "whole"], ["hard", "硬切", "hard cut"], ["size", "按字数", "by length"], ["symbol", "按符号", "by symbol"], ["sentence", "按句子", "by sentence"], ["paragraph", "按空行", "by paragraph"], ["heading", "按标题", "by heading"], ["recursive", "递归", "recursive"], ["qa", "问答对", "Q&A"], ["window", "句子窗口", "sentence window"]]
      : [["whole", "Whole"], ["hard", "Hard cut"], ["size", "By length"], ["symbol", "By symbol"], ["sentence", "Sentences"], ["paragraph", "Blank lines"], ["heading", "Headings"], ["recursive", "Recursive"], ["qa", "Q&A"], ["window", "Window"]];
    const overlapList = zh
      ? [["none", "不重叠", "no overlap"], ["sentence", "上一句", "last sentence"], ["chars", "固定字数", "fixed characters"], ["ratio", "百分比", "percent"]]
      : [["none", "None"], ["sentence", "Last sentence"], ["chars", "Characters"], ["ratio", "Percent"]];
    const symbolPresets = zh
      ? [["。", "。"], ["！", "！"], ["？", "？"], ["，", "，"], ["空行", "\\n\\n"], ["换行", "\\n"]]
      : [[". ", ". "], ["! ", "! "], ["? ", "? "], [", ", ", "], ["Blank line", "\\n\\n"], ["Newline", "\\n"]];
    const steps = zh
      ? {
          whole: [
            "过了门槛之后，整篇仍然是一块。字数再长也不切开。",
            "一块是向量库里的一行，也是 zip 里的一个 txt。"
          ],
          hard: [
            "字数小于 8 时按 8。空着或不是数字时按 80。",
            "从第一个字起，每隔这么多字切一刀。",
            "句号、换行、标题都不看。一句话可以从中间断开。"
          ],
          size: [
            "先去掉全文首尾空白。长度不超过上限，就一块。",
            "否则取接下来最多 N 个字，在这个窗口里从后往前找边界。边界是：空行、换行、。！？、英文的「. 」「! 」「? 」、「，」、英文的「, 」。",
            "离窗口末尾最近的边界胜出。它还得离这块开头超过上限的四成。上限 80 时，边界要在第 32 个字之后。更早的句号放过，刀落在第 80 个字。",
            "收刀之后跳过紧跟着的空白，再切下一块。"
          ],
          symbol: [
            "从左往右找你填的符号。刀口在符号后面，符号留在上一块末尾。",
            "每一块去掉行首行尾的空格和制表符。只剩空白的丢掉。最后一个符号后面剩下的字单独成一块。",
            "符号框是空的，整篇就是一块。",
            "字数上限不参与。切块那一页上，这个数字框还显示着，这一刀不读它。",
            "换行用下面的按钮。按钮写进框里的是 \\n。"
          ],
          sentence: [
            "先在。！？!? 后面切开。英文句号必须后面有空白才算一句，所以 Dr. Smith 会在 Dr. 后面断开。",
            "再把句子装进一块，直到再加一句就会超过 N 个字。",
            "上一句以。！？!? 结尾、下一句以英文字母开头时，中间加一个空格。上一句以这些符号结尾、下一句不是英文字母时，直接接上。其余情况加一个空格，所以英文句号后面会有空格。",
            "单独一句已经超过 N，这一句改用按字数的办法再切。"
          ],
          paragraph: [
            "一段是被空行隔开的文字。连续几个空行算同一个边界。",
            "短段用一个空行接在一起，直到再加一段会超过 N。",
            "单独一段已经超过 N，这一段改用按字数再切。"
          ],
          heading: [
            "单独成行、而且像标题，才开始新的一块。这一行超过 80 个字，就不当标题。",
            "算标题的写法：# 到 ###### 再加一个空格；「第…章 / 节 / 篇 / 部」，数字可以是阿拉伯数字或中文数字；「一、」「二、」这种；Chapter 或 Section 后面加数字；「1. 」或「1) 」，整行不超过 40 字，并且不以句号结尾。",
            "新标题出现时，前面已经有字，前面先收成一块。",
            "一块仍超过 N，再按字数切开。",
            "勾了「标题写进每一块」：这一块的第一行是标题时，从第二小块起，开头还没有这行标题，就补上这行，再加一个换行。"
          ],
          recursive: [
            "一层一层试。顺序固定：空行、换行、。、！、？、英文的「. 」「! 」「? 」、「，」、英文的「, 」、最后是一个空格。",
            "这一层的符号在这段里没有，就跳到下一层。",
            "切出来的小段还不长于 N，就留下。还长，就拿这一小段去试下一层。",
            "符号留在上一小段末尾，和按符号一样。",
            "所有符号都试过还是太长，才按字硬切。"
          ],
          qa: [
            "一行去掉首尾空白后，以「问：」「問：」或「Q:」「Q：」开头，就是新的一块。Q 不分大小写。冒号前可以有空格。冒号可以是半角或全角。",
            "这个问题后面的行都算回答，直到下一个问。",
            "全文里一处都没有这种行，整篇仍是一块。",
            "字数上限不参与。一个很长的回答也留在同一个问题里。",
            "不抄重叠。"
          ],
          window: [
            "先按句子切开，规则和「按句子」的第一步相同。",
            "每块装 K 句。K 小于 1 时按 2，大于 8 时按 8。",
            "下一块从下一句开始，仍然装 K 句。相邻两块因此共享 K−1 句。",
            "K 是 1 时，相邻块不共享，没有琥珀色。",
            "字数上限不参与。重叠那一排按钮也不参与。琥珀色就是这些共享的句子。",
            "剩下的句子不够再往后滑，就停。"
          ]
        }
      : {
          whole: [
            "Past the gate, the whole text is still one chunk. Length does not split it.",
            "One chunk is one row in the vector store, and one txt in the zip."
          ],
          hard: [
            "A number below 8 is treated as 8. An empty or invalid number is treated as 80.",
            "The cutter takes that many characters, then that many again, from the start.",
            "Sentence marks, line breaks, and headings are ignored. A sentence can be cut in the middle."
          ],
          size: [
            "The text is trimmed. Within the limit, it stays one chunk.",
            "Otherwise the cutter takes the next N characters and searches that window from the end. Boundaries are a blank line, a newline, 。！？, '. ', '! ', '? ', ，, and ', '.",
            "The boundary closest to the end of the window wins, and it has to sit past 40% of the limit. At 80, that is after character 32. An earlier sentence mark is skipped, and the cut falls on character 80.",
            "Whitespace after the cut is skipped. The next chunk starts there."
          ],
          symbol: [
            "The cutter finds the symbol from the left. The cut is just after it, so the symbol stays on the previous chunk.",
            "Each piece loses leading and trailing spaces and tabs. A piece that is only whitespace is dropped. Text after the last symbol is its own chunk.",
            "An empty symbol box keeps the whole text as one chunk.",
            "The character limit is not read. On the chunking page that box is still on screen for this cut.",
            "The buttons under the box write a newline as \\n."
          ],
          sentence: [
            "Split after 。！？!?. An English period counts only when a space follows, so 'Dr. Smith' splits after 'Dr.'.",
            "Sentences pack into a chunk until one more sentence would pass N characters.",
            "If the previous sentence ends in 。！？!? and the next starts with an English letter, a space is added. If it ends in those marks and the next does not start with an English letter, the text is joined directly. Every other join adds a space, which is why an English period is followed by a space.",
            "A single sentence longer than N is cut again with the by-length rule."
          ],
          paragraph: [
            "A paragraph is the text between blank lines. Several blank lines are one boundary.",
            "Short paragraphs are joined with one blank line until one more paragraph would pass N.",
            "A single paragraph longer than N is cut again with the by-length rule."
          ],
          heading: [
            "A line starts a new chunk when it stands alone and looks like a heading. A line longer than 80 characters is never a heading.",
            "These count: # through ###### plus a space; 第…章 / 节 / 篇 / 部 with Arabic or Chinese numerals; 一、二、 and the same pattern; Chapter or Section plus a number; a '1.' or '1)' line of at most 40 characters that does not end with a sentence mark.",
            "When a new heading appears and the lines before it already contain text, those lines close as one chunk.",
            "A chunk still over N is cut again with the by-length rule.",
            "With 'copy the heading' on, if the block starts with a heading, each later piece that does not already start with that line gets the heading and a newline in front."
          ],
          recursive: [
            "Separators are tried in a fixed order: a blank line, a newline, 。, ！, ？, '. ', '! ', '? ', ，, ', ', then a space.",
            "If this separator is absent, the cutter tries the next one.",
            "A piece within N is kept. A longer piece is sent to the next separator.",
            "The separator stays on the end of the previous piece, the same way 'by symbol' works.",
            "When every separator has been tried and the piece is still too long, it is hard-cut by characters."
          ],
          qa: [
            "A line that starts, after trimming, with 问：, 問：, Q:, or Q： opens a chunk. Q ignores case. Spaces may sit before the colon. The colon may be half-width or full-width.",
            "The following lines stay with that question until the next question line.",
            "If the text has no such line, it stays one chunk.",
            "The character limit is not read. A long answer stays with its question.",
            "Overlap is not copied."
          ],
          window: [
            "Sentences are split with the same first step as Sentences.",
            "Each chunk holds K sentences. Below 1 becomes 2. Above 8 becomes 8.",
            "The next chunk starts one sentence later and again holds K sentences, so neighbours share K−1 sentences.",
            "When K is 1, neighbours share nothing, and there is no amber.",
            "The character limit is not read, and the overlap buttons are not read. Amber is those shared sentences.",
            "The slide stops when there are not enough sentences left to move forward."
          ]
        };
    const overlapSteps = zh
      ? {
          none: ["下一块只含新的字。"],
          sentence: [
            "抄上一块的最后一句。",
            "这一句超过 180 字时，只抄末尾 180 字。",
            "下一块已经以这句开头，就不再接一次，只标成琥珀色。",
            "否则写在下一块最前面，后面加一个换行，再接新的字。琥珀色含那个换行。"
          ],
          chars: [
            "抄上一块末尾 N 个字。N 空着或小于 1 时按 20。",
            "不会把上一块整块抄过来：至少留 1 个字不抄。",
            "下一块已经以这段开头，就只标成琥珀色。否则写在最前面，再加一个换行。"
          ],
          ratio: [
            "抄上一块长度的百分之 N。N 大于 90 时按 90。空着或小于 1 时按 20。",
            "至少抄 1 个字，并且至少留 1 个字不抄。",
            "下一块已经以这段开头，就只标成琥珀色。否则写在最前面，再加一个换行。"
          ]
        }
      : {
          none: ["The next chunk contains only its own new text."],
          sentence: [
            "Copy the previous chunk's last sentence.",
            "If that sentence is longer than 180 characters, only the last 180 are copied.",
            "If the next chunk already starts with that sentence, it is not copied again. It is only marked amber.",
            "Otherwise it is written at the front, then a newline, then the new text. The amber includes that newline."
          ],
          chars: [
            "Copy the last N characters of the previous chunk. An empty or invalid N becomes 20.",
            "The whole previous chunk is never copied: at least 1 character stays behind.",
            "If the next chunk already starts with that text, it is only marked amber. Otherwise it is written at the front, then a newline."
          ],
          ratio: [
            "Copy N percent of the previous chunk's length. Above 90 becomes 90. An empty or invalid N becomes 20.",
            "At least 1 character is copied, and at least 1 character stays behind.",
            "If the next chunk already starts with that text, it is only marked amber. Otherwise it is written at the front, then a newline."
          ]
        };

    const termRows = zh
      ? [
          ["块", "chunk", "「出发前申请。」可以单独成一块。一块是 zip 里的一个 txt，也是向量库里的一行。"],
          ["字数", "chunk size", "上限填 20。「出发前申请。」是 6 个字，放得下。再加「未批复前不得离岗。」一共 15 个字，仍放得下。再加一句如果超过 20，就另起一块。"],
          ["门槛", "gate", "全文只有「出发前申请。」，6 个字。门槛填 80。6 ≤ 80，整篇一块，下面的刀都不走。填 0 才继续切。"],
          ["重叠", "overlap", "上一块以「未批复前不得离岗。」结尾。下一块的正文开头会再写上这一句。"],
          ["琥珀色", "amber", "页面上「未批复前不得离岗。」涂成琥珀色，表示这句是抄来的。txt 里有这几个字，没有颜色。"],
          ["硬切", "hard cut", "上限 2。「年假须写明」切成「年假」「须写」「明」。刀落在第 2 个字，不看句号。"],
          ["按字数", "by length", "上限 8。「出发前申请。」是 6 个字，句号在窗口后半，就在句号收刀。下一句「未批复前不得离岗。」另起一块。"],
          ["按符号", "by symbol", "符号填「。」。「出发前申请。」是一块，句号留在这块末尾。下一块从「未批复前不得离岗」开始。"],
          ["按句子", "by sentence", "「出发前申请。」是一句，「未批复前不得离岗。」是下一句。上限 20 时，两句装进同一块。上限 8 时，第一句单独成块。"],
          ["按空行", "by paragraph", "两段之间的空行是边界。两段都短，上限 40 时合成一块，中间仍留一个空行。"],
          ["按标题", "by heading", "「# 年假」单独成行。后面的规定跟到下一个标题「# 过敏」之前。勾了「标题写进每一块」时，切开的每一小块开头都会再写「# 年假」。"],
          ["递归", "recursive", "先在空行处切。一段仍超过字数，就改在换行处切，再改在「。」处切。这些边界都没有，才按字硬切。"],
          ["问答对", "Q&A", "「问：怎么请假？」开头是新的一块。「答：出发前十个工作日提交。」跟在这个问题后面，直到下一个「问：」。"],
          ["句子窗口", "sentence window", "三句是 A。B。C。每块 2 句。第一块是 A。B。第二块丢掉 A，留下 B，补上 C。相邻两块共享 B。"],
          ["上一句", "last sentence", "重叠选「上一句」。抄的是上一块最后一句「未批复前不得离岗。」，不是末尾固定的几个字。"],
          ["固定字数", "fixed characters", "填 4。只抄上一块末尾 4 个字，例如「得离岗。」。至少留 1 个字不抄。"],
          ["百分比", "percent", "上一块 20 个字，填 25。抄末尾 5 个字。填到 90 以上仍按 90，不会把上一块整块抄过来。"]
        ]
      : [
          ["Chunk", "", "“Apply before you travel.” can be one chunk by itself. One chunk is one txt in the zip, and one row in the vector store."],
          ["Chunk size", "", "The limit is 20. “Apply now.” is 10 characters, so it fits. “Apply now. Wait.” is 16, so both sentences stay in that chunk. One more sentence past 20 starts a new chunk."],
          ["Gate", "", "The whole text is “Apply now.”, 10 characters. The gate is 80. 10 ≤ 80, so it stays one chunk and the chosen cut does not run. 0 means the cut still runs."],
          ["Overlap", "", "The previous chunk ends with “Do not leave yet.” The next chunk starts by writing that sentence again."],
          ["Amber", "", "“Do not leave yet.” is painted amber on this page because it was copied. The txt contains those characters, with no colour."],
          ["Hard cut", "", "The limit is 5. “Apply now.” becomes “Apply” and “ now.”. The cut falls on the 5th character and ignores the period."],
          ["By length", "", "The limit is 12. “Apply now.” is 10 characters and the period sits in the latter part of the window, so the cut stops at the period. The next sentence starts a new chunk."],
          ["By symbol", "", "The symbol is “. ”. “Apply now.” is one chunk, and the period stays at the end of it. The next chunk starts at “Do not”."],
          ["By sentence", "", "“Apply now.” is one sentence. “Do not leave yet.” is the next. At a limit of 40 they pack into one chunk. At a limit of 12 the first sentence is its own chunk."],
          ["By paragraph", "", "A blank line between two paragraphs is the boundary. When both are short and the limit is 40, they join into one chunk with one blank line still between them."],
          ["By heading", "", "“# Leave” stands on its own line. The rules under it stay with that heading until “# Allergy”. With “copy the heading” on, each later piece starts with “# Leave” again."],
          ["Recursive", "", "Cut at a blank line first. If a piece is still over the limit, try a newline, then a period. When none of those boundaries exist, hard-cut by characters."],
          ["Q&A", "", "“Q: How do I apply?” starts a chunk. “A: Apply ten working days ahead.” stays with that question until the next “Q:”."],
          ["Sentence window", "", "Three sentences are A. B. C. Each chunk holds 2. The first chunk is A. B. The next drops A, keeps B, and adds C. Neighbours share B."],
          ["Last sentence", "", "With overlap set to last sentence, the copy is the previous chunk’s last sentence, “Do not leave yet.”, not a fixed number of characters."],
          ["Fixed characters", "", "Set 4. Only the last 4 characters of the previous chunk are copied, for example “yet.”. At least 1 character stays behind."],
          ["Percent", "", "The previous chunk is 20 characters and the box says 25. The last 5 characters are copied. Above 90 is treated as 90, so the whole previous chunk is never copied."]
        ];

    app.innerHTML =
      "<p class='hint'>" + (zh
        ? "右边的块和切块那一页是同一段程序。这里默认 40 个字，短文才切得开。切块页的默认是 80。"
        : "The pieces on the right come from the same program as the chunking page. This page starts at 40 characters so the short passage splits. The chunking page starts at 80.") + "</p>" +
      "<table class='terms'><thead><tr><th>" + (zh ? "术语" : "Term") + "</th><th>" + (zh ? "例子" : "Example") + "</th></tr></thead><tbody>" +
      termRows.map(function (row) {
        return "<tr><td><strong>" + escapeHtml(row[0]) + "</strong>" + (row[1] ? "<span class='en-term'>" + escapeHtml(row[1]) + "</span>" : "") + "</td><td>" + escapeHtml(row[2]) + "</td></tr>";
      }).join("") + "</tbody></table>" +
      "<div class='row methods' id='methods'>" + methodList.map(function (item) {
        return termButton("mode", item);
      }).join("") + "</div>" +
      "<p id='reads' class='reads'></p>" +
      "<div class='columns'>" +
      "<section class='panel'>" +
      "<h2>" + (zh ? "这一刀怎么走" : "How this cut moves") + "</h2>" +
      "<p id='always' class='hint'>" + (zh
        ? "门槛（gate）先于任何刀。全文长度小于或等于这个字数，而且门槛大于 0，结果是一整块，没有重叠（overlap）。0 表示继续用你选的这一刀。粘贴的文本会先把回车换成换行，再去掉首尾空白。字数（chunk size）按字符串长度：一个汉字、一个英文字母、一个标点，都算 1。"
        : "The gate runs before every cut. If the text is no longer than the gate and the gate is above 0, the result is one chunk with no overlap. 0 means the cut you picked still runs. Pasted text turns carriage returns into newlines, then trims. Length is a string length: one Han character, one letter, and one punctuation mark each count as 1.") + "</p>" +
      "<ol id='steps' class='steps'></ol>" +
      "<h2 id='overlap-head'>" + (zh ? "重叠（overlap）怎么写进文件" : "How overlap is written into the file") + "</h2>" +
      "<p id='overlap-lead' class='hint'>" + (zh
        ? "琥珀色（amber）只是这一页上的颜色。txt 里有这些字，没有颜色标记。第一块不抄。整篇和问答对不抄。句子窗口（sentence window）用自己的滑动，不读这排按钮。"
        : "Amber is only the colour on this page. The txt contains these characters, with no colour mark. The first chunk copies nothing. Whole and Q&A copy nothing. A sentence window uses its own slide and does not read these buttons.") + "</p>" +
      "<ol id='overlap-steps' class='steps'></ol>" +
      "<div class='field only' id='size-row'><label for='max'>" + (zh ? "一块最多多少字 chunk size" : "Most characters in one chunk") + "</label><input id='max' type='number' min='8' value='40' /></div>" +
      "<div class='field only' id='overlap-row'><label>" + (zh ? "重叠 overlap" : "Overlap") + "</label><div class='row methods' id='overlap-kinds'>" + overlapList.map(function (item) {
        return termButton("overlap", item);
      }).join("") + "</div></div>" +
      "<div class='field only' id='amount-row'><label for='amount'>" + (zh ? "重叠多少字" : "Overlap characters") + "</label><input id='amount' type='number' min='1' value='12' /></div>" +
      "<div class='field only' id='symbol-row'><label for='symbol'>" + (zh ? "遇到这个符号就切" : "Cut at this symbol") + "</label><input id='symbol' type='text' value='" + (zh ? "。" : ". ") + "' autocomplete='off' /><div class='row methods' id='symbol-presets'>" + symbolPresets.map(function (item) {
        return "<button type='button' data-symbol='" + escapeHtml(item[1]) + "'>" + escapeHtml(item[0]) + "</button>";
      }).join("") + "</div></div>" +
      "<div class='field only' id='window-row'><label for='window-n'>" + (zh ? "每块几句 sentence window" : "Sentences in one chunk") + "</label><input id='window-n' type='number' min='1' max='8' value='2' /></div>" +
      "<label class='check only' id='title-row'><input id='keep-title' type='checkbox' checked />" + (zh ? "标题写进被切开的每一块" : "Copy the heading into every piece of that section") + "</label>" +
      "<div class='field'><label for='gate'>" + (zh ? "门槛 gate。短于多少字就整篇一块。0 表示总是切。" : "Shorter than this stays one chunk. 0 always cuts.") + "</label><input id='gate' type='number' min='0' value='0' /></div>" +
      "<h2>" + (zh ? "标本" : "Passage") + "</h2>" +
      "<div class='row'><button type='button' id='sample'>" + (zh ? "填入课文" : "Fill the handbook") + "</button><button type='button' id='sample-qa'>" + (zh ? "填入问答" : "Fill questions") + "</button></div>" +
      "<textarea id='body' class='tall'></textarea>" +
      "</section>" +
      "<section class='panel'>" +
      "<h2>" + (zh ? "切出来的块" : "The chunks") + "</h2>" +
      "<p id='summary' class='hint'></p>" +
      "<div id='pieces' class='guide-pieces'></div>" +
      "<h2>" + (zh ? "文件名" : "File names") + "</h2>" +
      "<p id='names' class='hint'></p>" +
      "<p class='hint'>" + (zh
        ? "名字取自剥掉重叠之后的第一行。行首的 # 会去掉，空格变成连字符，只留字母、数字、下划线和汉字，最长 20 个字，前面加三位编号。正文里仍然有重叠的字。"
        : "The name comes from the first line after the copied overlap is removed. Leading # marks go, spaces become hyphens, and only letters, digits, underscores, and Han characters remain, up to 20 characters, with a three-digit prefix. The file body still contains the overlap.") + "</p>" +
      "<p class='hint'><a href='09-split.html'>" + (zh ? "回到切块页，在那里下载 zip。" : "Back to the chunking page to download the zip.") + "</a></p>" +
      "</section>" +
      "</div>";

    let currentMode = "size";
    let overlapKind = "sentence";

    function maxChars() {
      const n = Number(document.getElementById("max").value);
      if (!Number.isFinite(n) || n < 8) return 80;
      return Math.floor(n);
    }

    function amount() {
      const n = Number(document.getElementById("amount").value);
      if (!Number.isFinite(n) || n < 1) return 20;
      if (overlapKind === "ratio") return Math.min(90, Math.floor(n));
      return Math.floor(n);
    }

    function windowN() {
      const n = Number(document.getElementById("window-n").value);
      if (!Number.isFinite(n) || n < 1) return 2;
      return Math.min(8, Math.floor(n));
    }

    function gateN() {
      const n = Number(document.getElementById("gate").value);
      if (!Number.isFinite(n) || n < 1) return 0;
      return Math.floor(n);
    }

    function readSymbol() {
      return document.getElementById("symbol").value.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    }

    function normalize(text) {
      return String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    }

    function fileSlug(text, n, overlap) {
      let body = text;
      if (overlap && text.indexOf(overlap) === 0) body = text.slice(overlap.length).trim();
      const first = (body.split("\n").find(function (line) { return line.trim(); }) || "").trim().replace(/^#{1,6}\s*/, "");
      let slug = first.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u3400-\u9fff-]+/g, "");
      slug = slug.replace(/^-+|-+$/g, "").slice(0, 20);
      const num = String(n).padStart(3, "0");
      return (slug ? num + "-" + slug : num) + ".txt";
    }

    function paintMark(text, overlap) {
      if (overlap && text.indexOf(overlap) === 0) {
        return "<mark class='overlap'>" + escapeHtml(overlap) + "</mark>" + escapeHtml(text.slice(overlap.length));
      }
      return escapeHtml(text);
    }

    function fillList(id, lines) {
      document.getElementById(id).innerHTML = lines.map(function (line) {
        return "<li>" + escapeHtml(line) + "</li>";
      }).join("");
    }

    function readsLine(mode) {
      if (zh) {
        if (mode === "whole" || mode === "qa") return "这一刀读门槛 gate。字数 chunk size 和重叠 overlap 的按钮都不读。";
        if (mode === "window") return "这一刀读「每块几句」sentence window 和门槛 gate。字数和重叠按钮都不读。";
        if (mode === "symbol") return "这一刀读符号 symbol、重叠 overlap 和门槛 gate。字数不读。";
        if (mode === "heading") return "这一刀读字数 chunk size、重叠 overlap、门槛 gate，以及标题要不要写进每一块。";
        return "这一刀读字数 chunk size、重叠 overlap 和门槛 gate。";
      }
      if (mode === "whole" || mode === "qa") return "This cut reads the gate. It does not read the character limit or the overlap buttons.";
      if (mode === "window") return "This cut reads the sentence count and the gate. It does not read the character limit or the overlap buttons.";
      if (mode === "symbol") return "This cut reads the symbol, the overlap, and the gate. It does not read the character limit.";
      if (mode === "heading") return "This cut reads the character limit, the overlap, the gate, and whether the heading is copied into every piece.";
      return "This cut reads the character limit, the overlap, and the gate.";
    }

    function produce(text) {
      const gate = gateN();
      if (gate > 0 && text.length <= gate) return { pieces: [{ text: text, overlap: "" }], saw: true, gated: true };
      if (currentMode === "window") return { pieces: windowChunks(text, windowN()), saw: true, gated: false };
      let pieces = [text];
      let saw = true;
      if (currentMode === "hard") pieces = hardCut(text, maxChars());
      else if (currentMode === "size") pieces = splitBySize(text, maxChars());
      else if (currentMode === "symbol") pieces = splitOnSymbol(text, readSymbol());
      else if (currentMode === "sentence") pieces = packPieces(sentencesOf(text), maxChars());
      else if (currentMode === "paragraph") pieces = packPieces(text.split(/\n\s*\n+/).map(function (part) { return part.trim(); }).filter(Boolean), maxChars(), "\n\n");
      else if (currentMode === "heading") pieces = headingPieces(text, maxChars(), document.getElementById("keep-title").checked);
      else if (currentMode === "recursive") pieces = recursiveSplit(text, maxChars());
      else if (currentMode === "qa") {
        const found = qaPieces(text);
        pieces = found.pieces.length ? found.pieces : [text];
        saw = found.saw;
      }
      const kind = currentMode === "whole" || currentMode === "qa" ? "none" : overlapKind;
      return { pieces: applyOverlap(pieces, kind, amount()), saw: saw, gated: false };
    }

    function paint() {
      const text = normalize(document.getElementById("body").value);
      const overlapOn = currentMode !== "whole" && currentMode !== "qa" && currentMode !== "window";
      document.querySelectorAll("#methods button").forEach(function (button) {
        button.classList.toggle("on", button.dataset.mode === currentMode);
      });
      document.querySelectorAll("#overlap-kinds button").forEach(function (button) {
        button.classList.toggle("on", button.dataset.overlap === overlapKind);
      });
      document.getElementById("reads").textContent = readsLine(currentMode);
      fillList("steps", steps[currentMode] || []);
      fillList("overlap-steps", overlapOn ? (overlapSteps[overlapKind] || []) : []);
      document.getElementById("overlap-head").hidden = !overlapOn;
      document.getElementById("overlap-lead").hidden = !overlapOn;
      document.getElementById("overlap-steps").hidden = !overlapOn;
      document.getElementById("size-row").classList.toggle("show", ["hard", "size", "sentence", "paragraph", "heading", "recursive"].indexOf(currentMode) !== -1);
      document.getElementById("overlap-row").classList.toggle("show", overlapOn);
      document.getElementById("amount-row").classList.toggle("show", overlapOn && (overlapKind === "chars" || overlapKind === "ratio"));
      document.getElementById("symbol-row").classList.toggle("show", currentMode === "symbol");
      document.getElementById("window-row").classList.toggle("show", currentMode === "window");
      document.getElementById("title-row").classList.toggle("show", currentMode === "heading");
      const amountLabel = document.querySelector("label[for='amount']");
      if (amountLabel) amountLabel.textContent = overlapKind === "ratio" ? (zh ? "重叠百分之几" : "Overlap percent") : (zh ? "重叠多少字" : "Overlap characters");
      const box = document.getElementById("pieces");
      const summary = document.getElementById("summary");
      const names = document.getElementById("names");
      if (!text) {
        box.innerHTML = "";
        summary.textContent = zh ? "先放上一段文字。" : "Put some text in first.";
        names.textContent = "";
        return;
      }
      const made = produce(text);
      const pieces = made.pieces;
      const longest = pieces.reduce(function (n, piece) { return Math.max(n, piece.text.length); }, 0);
      const overlapChars = pieces.reduce(function (n, piece) { return n + (piece.overlap ? piece.overlap.length : 0); }, 0);
      let line = "";
      if (zh) {
        line = "全文 " + text.length + " 字，切成 " + pieces.length + " 块。最长 " + longest + " 字。";
        if (made.gated) line += " 不超过门槛 gate " + gateN() + "，所以没有按这一刀切开。";
        else line += " 琥珀色一共 " + overlapChars + " 字，这些字在 txt 里。";
        if (currentMode === "qa" && !made.saw) line += " 这篇里没有「问：」或「Q:」。";
      } else {
        line = text.length + " characters, cut into " + pieces.length + (pieces.length === 1 ? " chunk. " : " chunks. ") + "Longest is " + longest + ".";
        if (made.gated) line += " It is within the gate of " + gateN() + ", so this cut did not run.";
        else line += " Amber is " + overlapChars + " characters, and those characters are in the txt.";
        if (currentMode === "qa" && !made.saw) line += " This text has no Q: line.";
      }
      summary.innerHTML = "<span class='swatch'></span>" + escapeHtml(line);
      box.innerHTML = pieces.map(function (piece, index) {
        const overlapLength = piece.overlap ? piece.overlap.length : 0;
        return "<article><span class='tag'>" + (index + 1) + " · " + piece.text.length + (zh ? " 字" : " chars") + "</span><span class='tag'>" +
          (zh ? "重叠 " : "overlap ") + overlapLength + "</span><pre>" + paintMark(piece.text, piece.overlap || "") + "</pre></article>";
      }).join("");
      const labels = pieces.map(function (piece, index) {
        return fileSlug(piece.text, index + 1, piece.overlap || "");
      });
      names.textContent = labels.join("\n");
    }

    document.getElementById("methods").addEventListener("click", function (event) {
      const button = event.target.closest("button");
      if (!button || !button.dataset.mode) return;
      currentMode = button.dataset.mode;
      paint();
    });

    document.getElementById("overlap-kinds").addEventListener("click", function (event) {
      const button = event.target.closest("button");
      if (!button || !button.dataset.overlap) return;
      overlapKind = button.dataset.overlap;
      paint();
    });

    document.getElementById("symbol-presets").addEventListener("click", function (event) {
      const button = event.target.closest("button");
      if (!button || button.dataset.symbol == null) return;
      document.getElementById("symbol").value = button.dataset.symbol;
      paint();
    });

    ["max", "amount", "gate", "window-n", "symbol"].forEach(function (id) {
      document.getElementById(id).addEventListener("input", paint);
    });

    document.getElementById("keep-title").addEventListener("change", paint);

    let typing = 0;
    document.getElementById("body").addEventListener("input", function () {
      clearTimeout(typing);
      typing = setTimeout(paint, 200);
    });

    document.getElementById("sample").addEventListener("click", function () {
      document.getElementById("body").value = book;
      paint();
    });

    document.getElementById("sample-qa").addEventListener("click", function () {
      document.getElementById("body").value = questions;
      currentMode = "qa";
      paint();
    });

    document.getElementById("body").value = book;
    paint();
  }


  function pdfText(buffer) {
    const bytes = new Uint8Array(buffer);
    let raw = "";
    for (let i = 0; i < bytes.length; i++) raw += String.fromCharCode(bytes[i]);
    const parts = [];
    const hexRe = /<([0-9A-Fa-f\s]+)>/g;
    let match;
    while ((match = hexRe.exec(raw))) {
      const hex = match[1].replace(/\s+/g, "");
      if (hex.indexOf("FEFF") !== 0 || hex.length < 8) continue;
      let text = "";
      for (let i = 4; i + 4 <= hex.length; i += 4) {
        const code = parseInt(hex.slice(i, i + 4), 16);
        if (!Number.isNaN(code)) text += String.fromCharCode(code);
      }
      if (text.trim()) parts.push(text.trim());
    }
    const litRe = /\(((?:\\.|[^\\)])*)\)\s*Tj/g;
    while ((match = litRe.exec(raw))) {
      parts.push(match[1].replace(/\\n/g, "\n").replace(/\\([()\\])/g, "$1"));
    }
    return parts.join("\n").trim();
  }

  function unzipStored(buffer) {
    const bytes = new Uint8Array(buffer);
    const files = {};
    let i = 0;
    while (i + 30 < bytes.length) {
      if (bytes[i] !== 0x50 || bytes[i + 1] !== 0x4b || bytes[i + 2] !== 0x03 || bytes[i + 3] !== 0x04) break;
      const method = bytes[i + 8] | (bytes[i + 9] << 8);
      const size = bytes[i + 18] | (bytes[i + 19] << 8) | (bytes[i + 20] << 16) | (bytes[i + 21] << 24);
      const nameLen = bytes[i + 26] | (bytes[i + 27] << 8);
      const extraLen = bytes[i + 28] | (bytes[i + 29] << 8);
      const name = new TextDecoder().decode(bytes.slice(i + 30, i + 30 + nameLen));
      const start = i + 30 + nameLen + extraLen;
      if (method !== 0) throw new Error(zh ? "这份 docx 是压缩的" : "This docx is compressed");
      files[name] = bytes.slice(start, start + size);
      i = start + size;
    }
    return files;
  }

  async function docxText(buffer) {
    const files = unzipStored(buffer);
    const xmlBytes = files["word/document.xml"];
    if (!xmlBytes) throw new Error(zh ? "找不到 word/document.xml" : "word/document.xml is missing");
    const xml = new TextDecoder("utf-8").decode(xmlBytes);
    return xml.split(/<\/w:p>/).map(function (part) {
      return Array.from(part.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)).map(function (m) {
        return m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
      }).join("");
    }).filter(Boolean).join("\n").trim();
  }
})();
