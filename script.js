// Smooth scroll untuk navigation
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", function(e) {
    e.preventDefault();

    const target = document.querySelector(this.getAttribute("href"));

    if (target) {
      target.scrollIntoView({
        behavior: "smooth"
      });
    }
  });
});

// Navbar shadow bila scroll
window.addEventListener("scroll", function() {
  const navbar = document.querySelector(".navbar");

  if (window.scrollY > 50) {
    navbar.style.boxShadow = "0 4px 18px rgba(0,0,0,0.12)";
  } else {
    navbar.style.boxShadow = "0 2px 10px rgba(0,0,0,0.06)";
  }
});
