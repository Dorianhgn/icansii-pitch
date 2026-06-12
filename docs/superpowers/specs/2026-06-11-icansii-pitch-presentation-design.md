# I CAN SII — App de présentation pitch 180s

**Date :** 2026-06-11
**Type :** Design doc (spec) — single-page web app, GPU-enabled
**Cible :** Claude Code (build local)

---

## 1. Contexte & objectif

Pitch de stage en **180 secondes** devant un public **non technique** (directeur d'agence,
business managers). Le présentateur porte un **costume d'iPhone** avec les puces CPU / GPU / ANE
scratchées dessus, et incarne le téléphone à la première personne.

L'app est un **support visuel complémentaire au costume**, pas un slideshow classique :
une **single-page web app** sombre, naviguée au clavier (gauche / droite), avec un nuage de
points 3D animé en temps réel comme pièce maîtresse.

**Métaphore unificatrice (fil rouge) :** le **contour de la page = la puce active**.

- **Vert** → GPU (reconstruction 3D, perception géométrique)
- **Violet** → ANE (IA, segmentation sémantique)
- **Azur** → CPU (décision, secteurs angulaires → ceinture)

Le public retient « chaque couleur = un cerveau différent du téléphone » sans entendre un seul
acronyme. Le contour fait écho direct aux puces du costume.

**Contraintes dures :**

- Tout doit tourner **en local, hors-ligne**, en plein écran navigateur, sur le Mac de Dorian.
  Zéro dépendance réseau le jour J.
- **60 FPS** stable, transitions fluides.
- ~180s pour 8 états ≈ 22s chacun : les transitions doivent être **immédiates au clavier**,
  jamais d'attente d'animation bloquante.

---

## 2. Stack technique

**Vite + TypeScript + Three.js**, en **vanilla** (pas de framework UI).

- Vite : dev rapide + build statique servable en local.
- Three.js (depuis npm, écosystème complet — `PLYLoader`, `OrbitControls`, `CSS2DRenderer`
  disponibles, pas les limitations d'un artifact r128).
- Vanilla TS : un one-shot de présentation n'a pas besoin de React. Une state machine + des
  composants overlay suffisent et restent déterministes.

Le build final est servi en statique (`vite preview` ou un simple serveur local) puis présenté
en plein écran.

---

## 3. Architecture

Une **scène Three.js persistante** (canvas plein écran, toujours rendue) + des **couches DOM
overlay** par-dessus, le tout piloté par une **state machine** déclarative.

```
┌───────────────────────────────────────────────┐
│  Border (DOM)  — pulse coloré selon puce active │
│  ┌─────────────────────────────────────────┐   │
│  │  Overlays DOM (iPhone frames, pizza,     │   │
│  │  labels, titres, image plein écran)      │   │
│  │                                          │   │
│  │      Canvas Three.js (point cloud,       │   │
│  │      auto-rotation permanente)           │   │
│  └─────────────────────────────────────────┘   │
└───────────────────────────────────────────────┘
        ▲
   State machine  ──> applique l'état courant à : nuage (couleur),
   (slides.ts)         overlays (visibilité/position), bordure (couleur)
```

**Principe clé :** le nuage de points est **chargé une seule fois** (une géométrie). Changer de
slide ne recharge **rien** — on **échange l'attribut couleur** des points et on lerpe pour un
morph fluide. La caméra et la rotation ne s'interrompent jamais.

### Composants

| Composant | Rôle | Dépend de |
|---|---|---|
| `renderer.ts` | scène / caméra / boucle de rendu / auto-rotation Y | three |
| `PointCloud.ts` | charge la géométrie, expose `setColorState(name, {lerp})` | renderer, contrat data |
| `labels.ts` | labels flottants (CSS2D) ancrés aux centroïdes, suivent la rotation | renderer |
| `PhoneFrames.ts` | mockups iPhone RGB/depth, états de position (centre-large / coin-petit / avant-plan / caché) | DOM |
| `PizzaFan.ts` | éventail radar 5 cônes (SVG), couleurs par proximité | DOM |
| `Border.ts` | bordure pulsante, couleur = puce active | DOM |
| `slides.ts` | **données** : liste ordonnée des états | — |
| `state-machine.ts` | index courant, navigation clavier, applique l'état | tous |
| `main.ts` | preload assets → écran de chargement → démarre | tous |

---

## 4. Contrat de données (point cloud)

> Le *comment* du chargement est laissé à Claude Code. Ci-dessous **uniquement les exigences
> d'interface**.

Tout est **baké offline en Python** (via le pipeline `record_reconstruct.py` / `view_ply.py`).
**Aucune lecture de `.npz` dans le navigateur, aucune inférence dans le navigateur.**

Les trois états visuels du nuage (états 3, 4, 5) **partagent exactement la même géométrie**
(mêmes positions, même ordre de sommets). Seules les **couleurs par sommet** changent :

- `neutral` / `depth` — reconstruction brute (état 3)
- `obstacles` — points obstacles en **rouge** (calculé offline depuis les normales ; les normales
  ne quittent jamais Python), reste atténué
- `segmentation` — couleurs par classe COCO (80 classes standard) sur les objets reconnus,
  une couleur distincte par `coco_id` (générée deterministement offline), reste en gris neutre

**Format livré (recommandé) :** un seul fichier `scene.json` (ou binaire compact) avec :

```
{
  positions: Float32Array[N*3],          // une seule fois
  colors: {
    neutral:      Uint8Array[N*3],
    obstacles:    Uint8Array[N*3],
    segmentation: Uint8Array[N*3]
  },
  labels: [ { text: "person", class: 0, position: [x,y,z] }, ... ]  // coco_id, pour l'état segmentation
}
```

*Fallback accepté :* trois `.ply` colorés partageant le même ordre de sommets — l'app prend les
positions du premier et swappe les couleurs. **Exigence non négociable : ordre de sommets
identique entre états** (sinon le lerp couleur 1:1 casse).

**Budget points :** viser **< ~200k points** pour du 60 FPS confortable avec un `PointsMaterial`
simple. Sous-échantillonner offline si besoin (`VOXEL_SIZE` / `SUBSAMPLE`).

---

## 5. Système de slides (state machine)

Liste ordonnée. Navigation : **droite = avancer, gauche = reculer**, bornée (idempotent aux
extrémités).

| # | Nom | Visuel principal | Couleur nuage | Bordure (puce) | Transition entrante | ~durée |
|---|---|---|---|---|---|---|
| 0 | **Titre** | Fond night-blue, « I CAN SII » | — (caché) | neutre | — | 10s |
| 1 | **Le problème** | Image plein écran : rue 1ère pers., canne blanche, cercle rouge sur branche + trottinette | — | neutre | fondu | 30s |
| 2 | **Les capteurs** | 2 frames iPhone centrées, large : RGB (gauche) + depth (droite) | — | neutre | les frames montent en scène | 20s |
| 3 | **Reconstruction** | Frames glissent en **haut-gauche, petit** ; nuage apparaît + tourne | `neutral` | **vert** (GPU), pulse | morph layout + fade-in nuage | 25s |
| 4 | **Obstacles** | Même nuage, obstacles en rouge | `obstacles` (lerp) | **vert** (toujours géométrie) | lerp couleur | 20s |
| 5 | **Compréhension (IA)** | Recoloration segmentation + labels flottants ; reste gris | `segmentation` (lerp) | **violet** (ANE) | lerp couleur + apparition labels | 30s |
| 6 | **Décision** | Re-zoom app : frames iPhone reviennent à l'avant, écran **radar pizza** 5 cônes (vert/jaune/rouge) ; nuage atténué au fond | (atténué) | **azur** (CPU) | frames reviennent à l'avant-plan | 25s |
| 7 | **Verticalité / conclusion** | 3 mockups iPhone côte à côte, un éventail pizza pour **pieds / torse / tête** (secteur rouge haut = branche, bas = bordure) | (caché) | neutre / recap | split en 3 | 20s |

**Note narrative :** la chaîne monte en intelligence — 3D brute → obstacles (géométrie) →
compréhension (IA) → décision par secteurs (CPU → ceinture). On finit sur l'action (la pizza qui
déclenche la vibration) juste avant la conclusion.

---

## 6. Système de bordure / puce active

Une bordure intérieure (inset, ~6–10px) en `box-shadow` ou pseudo-élément, couleur = puce de
l'état courant. **Pulse lent et doux** (cycle ~2.5s, opacité/glow qui respire). Au changement
d'état, **crossfade de couleur** (~600ms), jamais de coupure sèche.

Palette de départ (à ajuster à l'œil) :

- fond : `#0a0e1a` (night-blue profond)
- vert GPU : `#3ce08f`
- violet ANE : `#a855f7`
- azur CPU : `#38bdf8`

États 0–2 : bordure neutre/discrète (aucune puce encore « active »).

---

## 7. Transitions & animations

- **Nuage :** auto-rotation **constante autour de l'axe vertical**, lente, jamais interrompue.
  (OrbitControls.autoRotate ou rotation manuelle de l'objet `Points` — préférer manuel pour
  rester déterministe sur scène ; drag souris optionnel pour le Q&A.)
- **Swap de couleur (3→4→5) :** interpolation par sommet entre les deux `colors` arrays sur
  ~600–900ms. Smooth, pas de flash.
- **Frames iPhone (2→3) :** transform CSS de *centre-large* vers *coin-haut-gauche-petit*,
  pendant que le nuage fait son fade-in. Elles **restent en insets** pendant 3→5 (source des
  capteurs), puis **reviennent à l'avant** en 6.
- **Labels (5) :** CSS2DRenderer, ancrés aux centroïdes, suivent la rotation du nuage.

---

## 8. Navigation & contrôles

- **Avancer :** `ArrowRight`, `PageDown`, `Space` — *(supporter PageDown/Space pour qu'un
  télécommande-clicker fonctionne)*.
- **Reculer :** `ArrowLeft`, `PageUp`.
- **Bornes :** aux extrémités, l'input est ignoré (pas de wrap, pas de crash).
- **Plein écran :** touche `F` (ou bouton discret), curseur masqué après inactivité.
- *(Optionnel, aide présentateur :)* maintenir une touche affiche l'index de slide courant.

---

## 9. Robustesse jour J

- **Preload total** avant l'écran 0 : nuage + toutes les images chargés, navigation activée
  seulement quand tout est prêt (écran de chargement). **Jamais de chargement en cours de pitch.**
- Pas de réseau, pas de son, pas de dépendance externe runtime.
- Si un asset manque → log + fallback visuel discret, **ne pas crasher**.
- Vérifier 60 FPS sur la **machine de présentation réelle** (pas seulement le Mac de dev).

---

## 10. Hors-scope (YAGNI — à NE PAS faire)

- ❌ iPhone 17 Pro placé/billboardé à l'emplacement de la scène (coût dev > 2s de valeur).
- ❌ Inférence / segmentation / calcul de normales **dans le navigateur** (tout baké offline).
- ❌ Mention de Mamba (jargon, hors-cible pour ce public).
- ❌ Lecture directe de `.npz` côté web.
- ❌ Framework UI, routing, backend.

---

## 11. Assets à fournir par Dorian

- `scene.json` (ou 3 `.ply`) — nuage baké, 3 états couleur + labels (cf. §4).
- Image scène-problème (état 1) — photo réelle annotée ou générée.
- `rgb.png` + `depth.png` — vrais screenshots de l'app (états 2/3, plus authentique que du généré).
- *(La pizza et les bordures sont générées en code, pas des assets.)*

---

## 12. Structure de repo suggérée

```
icansii-pitch/
├─ index.html
├─ package.json
├─ vite.config.ts
├─ public/assets/
│  ├─ scene/        # scene.json ou .ply bakés
│  └─ images/       # street.jpg, rgb.png, depth.png
├─ src/
│  ├─ main.ts             # preload + bootstrap
│  ├─ slides.ts           # données : liste des états
│  ├─ state-machine.ts    # nav clavier + application d'état
│  ├─ scene/{renderer,PointCloud,labels}.ts
│  ├─ overlays/{PhoneFrames,PizzaFan,Border}.ts
│  └─ styles.css
└─ docs/superpowers/specs/2026-06-11-icansii-pitch-presentation-design.md
```
