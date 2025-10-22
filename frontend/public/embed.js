(function () {
  // Create container
  const container = document.createElement('div');
  container.id = 'layerpath-root';
  document.body.appendChild(container);

  // Load React bundle (assumes served from your domain)
  const script = document.createElement('script');
  script.src = 'http://localhost:3000/src/App.js'; // Update to your production URL after build
  script.async = true;
  document.head.appendChild(script);
})();