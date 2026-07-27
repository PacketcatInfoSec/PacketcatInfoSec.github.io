/* Packetcat content workspace — Markdown rendering and authenticated publishing. */
(function () {
  "use strict";
  function escapeHtml(value) { return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
  function safeUrl(value) { return /^(https?:\/\/|mailto:)/i.test(value) ? value : "#"; }
  function inline(value) { return escapeHtml(value).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>").replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, function (_, label, url) { return '<a href="' + safeUrl(url) + '" rel="noopener noreferrer">' + label + "</a>"; }); }
  function markdown(value) {
    var lines = String(value || "").replace(/\r/g, "").split("\n"), html = [], inCode = false, inList = false;
    function closeList() { if (inList) { html.push("</ul>"); inList = false; } }
    lines.forEach(function (line) {
      if (/^```/.test(line)) { closeList(); html.push(inCode ? "</code></pre>" : "<pre><code>"); inCode = !inCode; return; }
      if (inCode) { html.push(escapeHtml(line) + "\n"); return; }
      if (/^[-*+]\s+/.test(line)) { if (!inList) { html.push("<ul>"); inList = true; } html.push("<li>" + inline(line.replace(/^[-*+]\s+/, "")) + "</li>"); return; }
      closeList(); if (!line.trim()) return;
      var heading = line.match(/^(#{1,3})\s+(.+)$/);
      if (heading) html.push("<h" + heading[1].length + ">" + inline(heading[2]) + "</h" + heading[1].length + ">");
      else if (/^>\s?/.test(line)) html.push("<blockquote>" + inline(line.replace(/^>\s?/, "")) + "</blockquote>");
      else if (/^---+$/.test(line)) html.push("<hr>");
      else html.push("<p>" + inline(line) + "</p>");
    });
    closeList(); if (inCode) html.push("</code></pre>"); return html.join("");
  }
  function excerpt(value) { return String(value || "").replace(/^#{1,6}\s+.*$/m, "").replace(/[`*_>#\-]/g, "").replace(/\s+/g, " ").trim().slice(0, 180); }
  function dateLabel(value) { return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
  function makeCard(item, type) {
    var article = document.createElement("article"); article.className = "card card--static";
    article.innerHTML = '<div class="card__top"><span class="card__title">' + escapeHtml(item.title || "Untitled") + '</span><span class="card__tag">' + escapeHtml(type === "writeup" ? "Markdown" : (item.tags || "field note")) + '</span></div><p class="card__desc">' + escapeHtml(item.summary || excerpt(item.body) || "No description provided.") + '</p><span class="card__url">' + dateLabel(item.created_at) + '</span><details class="content-detail"><summary>Read ' + (type === "writeup" ? "writeup" : "post") + '</summary><div class="markdown">' + markdown(item.body) + "</div></details>";
    return article;
  }
  function renderList(selector, emptySelector, items, type) {
    var list = document.querySelector(selector), empty = document.querySelector(emptySelector); if (!list) return;
    list.innerHTML = ""; items.forEach(function (item) { list.appendChild(makeCard(item, type)); }); if (empty) empty.hidden = items.length > 0;
  }
  function loadPosts(type, selector, emptySelector) {
    fetch("/api/posts?type=" + type).then(function (response) { return response.ok ? response.json() : []; }).catch(function () { return []; }).then(function (items) { renderList(selector, emptySelector, Array.isArray(items) ? items : [], type); });
  }
  function getSession() { return fetch("/api/auth/session").then(function (response) { return response.json(); }).catch(function () { return { authenticated: false }; }); }
  function publish(post) { return fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(post) }).then(async function (response) { var result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not publish content."); return result; }); }

  loadPosts("blog", "[data-blog-list]", "[data-blog-empty]");
  loadPosts("writeup", "[data-writeup-list]", "[data-writeup-empty]");

  var upload = document.querySelector("[data-writeup-upload]"), writeupNotice = document.querySelector("[data-writeup-message]");
  if (upload) upload.addEventListener("change", async function () {
    var session = await getSession();
    if (!session.authenticated) { writeupNotice.textContent = "Sign in with the authorized GitHub account before uploading a writeup."; upload.value = ""; return; }
    var files = Array.prototype.slice.call(upload.files);
    try {
      for (var index = 0; index < files.length; index += 1) {
        var file = files[index], body = await file.text(), firstHeading = body.match(/^#\s+(.+)$/m);
        await publish({ type: "writeup", title: firstHeading ? firstHeading[1] : file.name.replace(/\.(md|markdown)$/i, ""), summary: excerpt(body), markdown: body });
      }
      writeupNotice.textContent = files.length + " writeup" + (files.length === 1 ? "" : "s") + " published."; loadPosts("writeup", "[data-writeup-list]", "[data-writeup-empty]");
    } catch (error) { writeupNotice.textContent = error.message; }
    upload.value = "";
  });

  var studio = document.querySelector("[data-post-studio]"); if (!studio) return;
  var form = studio.querySelector("[data-post-form]"), title = form.elements.title, summary = form.elements.summary, tags = form.elements.tags, body = form.elements.body;
  var previewTitle = studio.querySelector("[data-preview-title]"), previewMeta = studio.querySelector("[data-preview-meta]"), previewBody = studio.querySelector("[data-preview-body]"), message = studio.querySelector("[data-post-message]"), login = studio.querySelector("[data-login]"), logout = studio.querySelector("[data-logout]"), authText = studio.querySelector("[data-auth-text]");
  function refreshPreview() { previewTitle.textContent = title.value.trim() || "Untitled post"; previewMeta.textContent = dateLabel(Date.now()) + (tags.value.trim() ? " · " + tags.value.trim() : ""); previewBody.innerHTML = markdown(body.value) || "<p>Your post preview will appear here.</p>"; }
  function setEditorAccess(allowed) { Array.prototype.forEach.call(form.querySelectorAll("input, textarea, button"), function (control) { control.disabled = !allowed; }); }
  getSession().then(function (session) { setEditorAccess(session.authenticated); authText.textContent = session.authenticated ? "Signed in as " + session.login : "Sign in to create and publish posts."; login.hidden = session.authenticated; logout.hidden = !session.authenticated; });
  [title, summary, tags, body].forEach(function (field) { field.addEventListener("input", refreshPreview); }); form.addEventListener("reset", function () { setTimeout(refreshPreview, 0); });
  form.addEventListener("submit", async function (event) { event.preventDefault(); try { await publish({ type: "blog", title: title.value.trim(), summary: summary.value.trim(), tags: tags.value.trim(), markdown: body.value }); message.textContent = "Published. Your post is now visible on the Blog page."; form.reset(); } catch (error) { message.textContent = error.message; } });
  studio.querySelector("[data-download-post]").addEventListener("click", function () { var filename = (title.value.trim() || "packetcat-post").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".md"; var data = "# " + (title.value.trim() || "Untitled post") + "\n\n" + (summary.value.trim() ? "> " + summary.value.trim() + "\n\n" : "") + body.value; var link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([data], { type: "text/markdown" })); link.download = filename; link.click(); URL.revokeObjectURL(link.href); });
  logout.addEventListener("click", function () { fetch("/api/auth/logout", { method: "POST" }).then(function () { window.location.reload(); }); });
  refreshPreview();
})();
