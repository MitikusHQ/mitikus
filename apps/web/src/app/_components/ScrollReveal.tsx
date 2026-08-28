'use client'

import { useEffect } from 'react'

export function ScrollReveal() {
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .reveal {
        opacity: 0;
        transform: translateY(24px);
        transition: opacity 1s ease, transform 1s ease;
      }
      .reveal.visible {
        opacity: 1;
        transform: translateY(0);
      }
    `
    document.head.appendChild(style)

    const els = document.querySelectorAll('section, footer')
    els.forEach((el) => el.classList.add('reveal'))

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08 },
    )

    els.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return null
}
