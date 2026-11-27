//! Shape matching for drawn gestures.
//!
//! $1-style: resample to evenly spaced points, move the centroid to the origin and
//! scale *uniformly* so the larger side is 1. Size and position therefore do not
//! matter, while direction, drawing order and proportions do (a short horizontal line
//! still matches a long one, and a left swipe never matches a right swipe). A small
//! rotation search absorbs a slightly tilted hand.

use crate::domain::profile::GesturePoint;

const SAMPLES: usize = 64;
/// Strokes shorter than this (px) are clicks, not gestures.
pub const MIN_PATH_LENGTH: f64 = 40.0;
/// Minimum similarity (0‥1) for a match.
pub const MIN_SCORE: f64 = 0.78;
/// Rotation tolerance, degrees.
const ROTATION_RANGE: f64 = 18.0;
const ROTATION_STEP: f64 = 3.0;

type Pt = (f64, f64);

pub fn path_length(points: &[GesturePoint]) -> f64 {
    points
        .windows(2)
        .map(|w| (w[1].x - w[0].x).hypot(w[1].y - w[0].y))
        .sum()
}

fn resample(points: &[GesturePoint], n: usize) -> Vec<Pt> {
    let total = path_length(points);
    let mut out: Vec<Pt> = Vec::with_capacity(n);
    let first = (points[0].x, points[0].y);
    out.push(first);
    if total <= f64::EPSILON {
        out.resize(n, first);
        return out;
    }
    let step = total / (n - 1) as f64;
    // Distance walked since the last emitted sample.
    let mut walked = 0.0;
    let mut prev = first;
    for p in points.iter().skip(1) {
        let cur = (p.x, p.y);
        let mut from = prev;
        let mut seg = (cur.0 - from.0).hypot(cur.1 - from.1);
        while walked + seg >= step && out.len() < n {
            let t = (step - walked) / seg;
            let q = (from.0 + t * (cur.0 - from.0), from.1 + t * (cur.1 - from.1));
            out.push(q);
            from = q;
            seg = (cur.0 - from.0).hypot(cur.1 - from.1);
            walked = 0.0;
        }
        walked += seg;
        prev = cur;
    }
    let last = points.last().map(|p| (p.x, p.y)).unwrap_or(first);
    while out.len() < n {
        out.push(last);
    }
    out
}

/// Resampled, centred, uniformly scaled (larger side = 1). `None` for a dot.
pub fn normalize(points: &[GesturePoint]) -> Option<Vec<Pt>> {
    if points.len() < 2 || path_length(points) < 1.0 {
        return None;
    }
    let pts = resample(points, SAMPLES);
    let (mut min_x, mut min_y, mut max_x, mut max_y) =
        (f64::MAX, f64::MAX, f64::MIN, f64::MIN);
    let (mut cx, mut cy) = (0.0, 0.0);
    for &(x, y) in &pts {
        min_x = min_x.min(x);
        max_x = max_x.max(x);
        min_y = min_y.min(y);
        max_y = max_y.max(y);
        cx += x;
        cy += y;
    }
    cx /= pts.len() as f64;
    cy /= pts.len() as f64;
    let size = (max_x - min_x).max(max_y - min_y);
    if size <= f64::EPSILON {
        return None;
    }
    Some(pts.iter().map(|&(x, y)| ((x - cx) / size, (y - cy) / size)).collect())
}

fn mean_distance(a: &[Pt], b: &[Pt], angle_deg: f64) -> f64 {
    let (s, c) = angle_deg.to_radians().sin_cos();
    a.iter()
        .zip(b)
        .map(|(&(x, y), &(tx, ty))| (x * c - y * s - tx).hypot(x * s + y * c - ty))
        .sum::<f64>()
        / a.len() as f64
}

/// Similarity 0‥1 between two normalized strokes (1 = identical).
pub fn similarity(candidate: &[Pt], template: &[Pt]) -> f64 {
    let mut best = f64::MAX;
    let mut angle = -ROTATION_RANGE;
    while angle <= ROTATION_RANGE + 1e-9 {
        best = best.min(mean_distance(candidate, template, angle));
        angle += ROTATION_STEP;
    }
    // Mean distance 0.5 ≈ unrelated (e.g. a reversed line) → 0.
    (1.0 - best / 0.5).clamp(0.0, 1.0)
}

/// Index and score of the template that best matches `stroke`, if any is close enough.
pub fn best_match<'a, I>(stroke: &[GesturePoint], templates: I) -> Option<(usize, f64)>
where
    I: IntoIterator<Item = &'a [GesturePoint]>,
{
    if path_length(stroke) < MIN_PATH_LENGTH {
        return None;
    }
    let candidate = normalize(stroke)?;
    templates
        .into_iter()
        .enumerate()
        .filter_map(|(i, t)| normalize(t).map(|t| (i, similarity(&candidate, &t))))
        .filter(|(_, score)| *score >= MIN_SCORE)
        .max_by(|a, b| a.1.total_cmp(&b.1))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn poly(points: &[(f64, f64)], steps: usize) -> Vec<GesturePoint> {
        let mut out = Vec::new();
        for w in points.windows(2) {
            for i in 0..steps {
                let t = i as f64 / steps as f64;
                out.push(GesturePoint {
                    x: w[0].0 + (w[1].0 - w[0].0) * t,
                    y: w[0].1 + (w[1].1 - w[0].1) * t,
                });
            }
        }
        let last = points[points.len() - 1];
        out.push(GesturePoint { x: last.0, y: last.1 });
        out
    }

    fn scaled(points: &[(f64, f64)], k: f64, dx: f64, dy: f64) -> Vec<(f64, f64)> {
        points.iter().map(|&(x, y)| (x * k + dx, y * k + dy)).collect()
    }

    fn circle(r: f64, n: usize) -> Vec<GesturePoint> {
        (0..=n)
            .map(|i| {
                let a = i as f64 / n as f64 * std::f64::consts::TAU;
                GesturePoint { x: r * a.cos(), y: r * a.sin() }
            })
            .collect()
    }

    const RIGHT: &[(f64, f64)] = &[(0.0, 0.0), (200.0, 0.0)];
    const LEFT: &[(f64, f64)] = &[(200.0, 0.0), (0.0, 0.0)];
    const DOWN: &[(f64, f64)] = &[(0.0, 0.0), (0.0, 200.0)];
    const L_SHAPE: &[(f64, f64)] = &[(0.0, 0.0), (0.0, 200.0), (150.0, 200.0)];
    const V_SHAPE: &[(f64, f64)] = &[(0.0, 0.0), (100.0, 200.0), (200.0, 0.0)];
    const Z_SHAPE: &[(f64, f64)] =
        &[(0.0, 0.0), (200.0, 0.0), (0.0, 200.0), (200.0, 200.0)];

    fn set() -> Vec<Vec<GesturePoint>> {
        vec![
            poly(RIGHT, 20),
            poly(LEFT, 20),
            poly(DOWN, 20),
            poly(L_SHAPE, 20),
            poly(V_SHAPE, 20),
            poly(Z_SHAPE, 20),
            circle(100.0, 60),
        ]
    }

    fn matched(stroke: &[GesturePoint]) -> Option<usize> {
        let templates = set();
        best_match(stroke, templates.iter().map(|t| t.as_slice())).map(|(i, _)| i)
    }

    #[test]
    fn same_shape_at_other_sizes_and_places() {
        for k in [0.3, 0.6, 1.0, 2.5] {
            assert_eq!(matched(&poly(&scaled(RIGHT, k, 500.0, 300.0), 7)), Some(0), "k={k}");
            assert_eq!(matched(&poly(&scaled(LEFT, k, 10.0, 0.0), 9)), Some(1), "k={k}");
            assert_eq!(matched(&poly(&scaled(L_SHAPE, k, 0.0, 40.0), 11)), Some(3), "k={k}");
            assert_eq!(matched(&poly(&scaled(V_SHAPE, k, 0.0, 0.0), 13)), Some(4), "k={k}");
            assert_eq!(matched(&poly(&scaled(Z_SHAPE, k, 80.0, 80.0), 5)), Some(5), "k={k}");
            assert_eq!(matched(&circle(100.0 * k, 37)), Some(6), "k={k}");
        }
    }

    #[test]
    fn tolerates_a_sloppy_hand() {
        // Slightly tilted, wobbly right swipe.
        let wobbly: Vec<GesturePoint> = (0..=40)
            .map(|i| {
                let x = i as f64 * 6.0;
                GesturePoint { x, y: x * 0.15 + (i as f64 * 1.3).sin() * 4.0 }
            })
            .collect();
        assert_eq!(matched(&wobbly), Some(0));
        // L drawn with uneven arms.
        assert_eq!(matched(&poly(&[(0.0, 0.0), (8.0, 260.0), (120.0, 250.0)], 15)), Some(3));
    }

    #[test]
    fn rejects_unrelated_and_tiny_strokes() {
        let only_right = [poly(RIGHT, 20)];
        let left = poly(LEFT, 20);
        assert!(best_match(&left, only_right.iter().map(|t| t.as_slice())).is_none());
        let down = poly(DOWN, 20);
        assert!(best_match(&down, only_right.iter().map(|t| t.as_slice())).is_none());
        let tiny = poly(&[(0.0, 0.0), (20.0, 0.0)], 5);
        assert!(matched(&tiny).is_none());
    }
}
