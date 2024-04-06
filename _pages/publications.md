---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: true
---

{% if site.author.googlescholar %}
  <div class="wordwrap">You can also find my articles on <a href="{{site.author.googlescholar}}">my Google Scholar profile</a>.</div>
{% endif %}

Publications
======
{% include base_path %}

{% for post in site.publications reversed %}
  {% include archive-single.html %}
{% endfor %}


Softwares
======
* [RNAmf](https://cran.r-project.org/web/packages/RNAmf/index.html): Recursive non-additive emulator for multi-fidelity data
![](https://cranlogs.r-pkg.org/badges/grand-total/RNAmf)
