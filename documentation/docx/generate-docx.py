#!/usr/bin/env python3
"""
ProTools Hub — Generador de documentación .docx
Convierte los 26 archivos Markdown de /docs en Word (.docx) usando pandoc.

Requisitos:
  - Python 3.8+
  - pandoc instalado y en PATH (https://pandoc.org/installing.html)
  - pip install pypandoc  (opcional — wrapper conveniente)

Uso:
  python documentation/docx/generate-docx.py

Los archivos .docx se generan en /documentation/docx/
"""

import subprocess
import sys
import os
from pathlib import Path
from datetime import datetime


DOCS_DIR   = Path(__file__).parent.parent.parent / "docs"
OUTPUT_DIR = Path(__file__).parent


DOCUMENTS = [
    ("00-introduccion.md",          "00 — Introducción y Guía de Lectura"),
    ("01-vision-producto.md",       "01 — Visión del Producto"),
    ("02-arquitectura-general.md",  "02 — Arquitectura General"),
    ("03-base-de-datos.md",         "03 — Base de Datos"),
    ("04-workspace.md",             "04 — Workspace y Layout"),
    ("05-marketplace.md",           "05 — Marketplace de Herramientas"),
    ("06-tool-intelligence.md",     "06 — Tool Intelligence Engine"),
    ("07-execution-engine.md",      "07 — Execution Engine"),
    ("08-intent-engine.md",         "08 — Intent Engine"),
    ("09-planning-engine.md",       "09 — Planning Engine"),
    ("10-workflow-engine.md",       "10 — Workflow Engine"),
    ("11-business-memory.md",       "11 — Business Memory"),
    ("12-business-copilot.md",      "12 — Business Copilot"),
    ("13-analytics-audit.md",       "13 — Analytics y Audit"),
    ("14-organization.md",          "14 — Organization y Multi-tenant"),
    ("15-seguridad.md",             "15 — Seguridad"),
    ("16-billing.md",               "16 — Billing y Monetización"),
    ("17-decision-engine.md",       "17 — Decision Engine [Diseño]"),
    ("18-ai-router.md",             "18 — AI Router [Diseño]"),
    ("19-qa-sentinel.md",           "19 — QA Sentinel"),
    ("20-historia-desarrollo.md",   "20 — Historia del Desarrollo"),
    ("21-biblioteca-superprompts.md","21 — Biblioteca de Superprompts"),
    ("22-manual-administrador.md",  "22 — Manual del Administrador"),
    ("23-manual-desarrollador.md",  "23 — Manual del Desarrollador"),
    ("24-api-reference.md",         "24 — API Reference"),
    ("25-changelog.md",             "25 — Changelog Oficial"),
]


def check_pandoc() -> bool:
    try:
        result = subprocess.run(
            ["pandoc", "--version"],
            capture_output=True,
            text=True,
        )
        version_line = result.stdout.splitlines()[0] if result.stdout else "unknown"
        print(f"✓ pandoc encontrado: {version_line}")
        return True
    except FileNotFoundError:
        print("✗ pandoc no encontrado.")
        print("  Instálalo desde: https://pandoc.org/installing.html")
        print("  En Windows (winget): winget install --id JohnMacFarlane.Pandoc")
        return False


def convert(md_file: str, title: str) -> tuple[bool, str]:
    src  = DOCS_DIR / md_file
    name = md_file.replace(".md", ".docx")
    dst  = OUTPUT_DIR / name

    if not src.exists():
        return False, f"SKIP — archivo fuente no existe: {src}"

    cmd = [
        "pandoc",
        str(src),
        "--from", "markdown+mermaid",
        "--to", "docx",
        "--output", str(dst),
        "--metadata", f"title={title}",
        "--metadata", f"date={datetime.today().strftime('%Y-%m-%d')}",
        "--metadata", "author=ProTools Hub Documentation",
        "--toc",
        "--toc-depth=3",
        "--standalone",
    ]

    reference_docx = Path(__file__).parent / "reference.docx"
    if reference_docx.exists():
        cmd += ["--reference-doc", str(reference_docx)]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode == 0:
            size_kb = dst.stat().st_size // 1024
            return True, f"OK ({size_kb} KB) → {name}"
        else:
            return False, f"ERROR pandoc: {result.stderr.strip()}"
    except subprocess.TimeoutExpired:
        return False, "ERROR: timeout (>60s)"
    except Exception as e:
        return False, f"ERROR inesperado: {e}"


def main() -> int:
    print("=" * 60)
    print("ProTools Hub — Generación de documentación .docx")
    print(f"Fecha: {datetime.today().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)
    print()

    if not check_pandoc():
        return 1

    print()
    print(f"Origen:  {DOCS_DIR}")
    print(f"Destino: {OUTPUT_DIR}")
    print()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    ok_count   = 0
    fail_count = 0
    skip_count = 0

    for md_file, title in DOCUMENTS:
        success, message = convert(md_file, title)
        if success:
            print(f"  ✓ {title}")
            print(f"      {message}")
            ok_count += 1
        elif message.startswith("SKIP"):
            print(f"  - {title}")
            print(f"      {message}")
            skip_count += 1
        else:
            print(f"  ✗ {title}")
            print(f"      {message}")
            fail_count += 1

    print()
    print("=" * 60)
    print(f"Resultado: {ok_count} OK · {skip_count} SKIP · {fail_count} ERROR")
    print("=" * 60)

    if fail_count > 0:
        print()
        print("Nota: Los bloques Mermaid se convierten a texto en .docx.")
        print("Para diagramas visuales, convierte a PDF primero:")
        print("  pandoc --to pdf (requiere LaTeX o WeasyPrint)")

    return 0 if fail_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
