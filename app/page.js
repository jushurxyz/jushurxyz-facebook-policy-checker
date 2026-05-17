function renderLinkedReport(report) {
  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  let linkedText = escapeHtml(report);

  // grassetto markdown
  linkedText = linkedText.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );

  // ritorni a capo
  linkedText = linkedText.replace(/\n/g, "<br>");

  const replacements = [
    {
      terms: [
        "incitamento all'odio",
        "discorsi d'odio",
        "hateful conduct",
        "odio"
      ],
      url:
        "https://transparency.meta.com/policies/community-standards/hateful-conduct/"
    },
    {
      terms: [
        "minacce",
        "violenza",
        "violence and incitement"
      ],
      url:
        "https://transparency.meta.com/policies/community-standards/violence-incitement/"
    },
    {
      terms: [
        "bullismo",
        "molestie",
        "bullying and harassment"
      ],
      url:
        "https://transparency.meta.com/policies/community-standards/bullying-harassment/"
    },
    {
      terms: [
        "nudità",
        "contenuti sessuali",
        "adult nudity",
        "sexual activity"
      ],
      url:
        "https://transparency.meta.com/policies/community-standards/adult-nudity-sexual-activity/"
    },
    {
      terms: [
        "autolesionismo",
        "suicidio",
        "self-injury"
      ],
      url:
        "https://transparency.meta.com/policies/community-standards/suicide-self-injury/"
    },
    {
      terms: [
        "spam",
        "truffa",
        "frode"
      ],
      url:
        "https://transparency.meta.com/policies/community-standards/spam/"
    },
    {
      terms: [
        "privacy",
        "dati personali"
      ],
      url:
        "https://transparency.meta.com/policies/community-standards/privacy-violations/"
    }
  ];

  replacements.forEach((item) => {
    item.terms
      .sort((a, b) => b.length - a.length)
      .forEach((term) => {
        const regex = new RegExp(
          `\\b(${term})\\b`,
          "gi"
        );

        linkedText = linkedText.replace(
          regex,
          `<a href="${item.url}" target="_blank" rel="noopener noreferrer" style="color:#93c5fd;text-decoration:underline;font-weight:bold;">$1</a>`
        );
      });
  });

  return linkedText;
}
