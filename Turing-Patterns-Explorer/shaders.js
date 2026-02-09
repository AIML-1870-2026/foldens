// ============================================================
// Turing Patterns Explorer — GLSL Shader Sources
// Uses weighted 9-point Laplacian stencil for numerical stability
// Weights: corners=0.05, edges=0.2, center=-1.0
// ============================================================

const SHADERS = {

// ---- Shared vertex shader (fullscreen quad) ----
vertex: `#version 300 es
layout(location=0) in vec2 a_position;
out vec2 v_uv;
void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`,

// ---- Gray-Scott reaction-diffusion ----
grayScott: `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform vec2 u_texel;
uniform float u_feed, u_kill, u_dA, u_dB, u_dt;
uniform vec2 u_brush;
uniform float u_brushR, u_brushChem;
in vec2 v_uv;
out vec4 fc;
void main() {
    vec2 t = u_texel;
    float a = texture(u_state, v_uv).r;
    float b = texture(u_state, v_uv).g;
    // 9-point weighted Laplacian (stable with dA=1.0, dt=1.0)
    vec4 tl = texture(u_state, v_uv + vec2(-t.x, t.y));
    vec4 tc = texture(u_state, v_uv + vec2(  0., t.y));
    vec4 tr = texture(u_state, v_uv + vec2( t.x, t.y));
    vec4 ml = texture(u_state, v_uv + vec2(-t.x,  0.));
    vec4 mr = texture(u_state, v_uv + vec2( t.x,  0.));
    vec4 bl = texture(u_state, v_uv + vec2(-t.x,-t.y));
    vec4 bc = texture(u_state, v_uv + vec2(  0.,-t.y));
    vec4 br = texture(u_state, v_uv + vec2( t.x,-t.y));
    float la = tl.r*0.05 + tc.r*0.2 + tr.r*0.05
             + ml.r*0.2  - a         + mr.r*0.2
             + bl.r*0.05 + bc.r*0.2  + br.r*0.05;
    float lb = tl.g*0.05 + tc.g*0.2 + tr.g*0.05
             + ml.g*0.2  - b         + mr.g*0.2
             + bl.g*0.05 + bc.g*0.2  + br.g*0.05;
    float ab2 = a * b * b;
    float da = u_dA * la - ab2 + u_feed * (1.0 - a);
    float db = u_dB * lb + ab2 - (u_kill + u_feed) * b;
    a += da * u_dt;
    b += db * u_dt;
    vec2 px = v_uv / t;
    float d = length(px - u_brush);
    if (u_brush.x >= 0.0 && d < u_brushR) {
        float s = smoothstep(u_brushR, 0.0, d) * 0.4;
        if (u_brushChem < 0.5) a = mix(a, 1.0, s);
        else b = mix(b, 1.0, s);
    }
    fc = vec4(clamp(a,0.0,1.0), clamp(b,0.0,1.0), 0.0, 1.0);
}`,

// ---- Brusselator reaction-diffusion ----
brusselator: `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform vec2 u_texel;
uniform float u_a, u_b, u_du, u_dv, u_dt;
uniform vec2 u_brush;
uniform float u_brushR, u_brushChem;
in vec2 v_uv;
out vec4 fc;
void main() {
    vec2 t = u_texel;
    float cu = texture(u_state, v_uv).r;
    float cv = texture(u_state, v_uv).g;
    vec4 tl = texture(u_state, v_uv + vec2(-t.x, t.y));
    vec4 tc = texture(u_state, v_uv + vec2(  0., t.y));
    vec4 tr = texture(u_state, v_uv + vec2( t.x, t.y));
    vec4 ml = texture(u_state, v_uv + vec2(-t.x,  0.));
    vec4 mr = texture(u_state, v_uv + vec2( t.x,  0.));
    vec4 bl = texture(u_state, v_uv + vec2(-t.x,-t.y));
    vec4 bc = texture(u_state, v_uv + vec2(  0.,-t.y));
    vec4 br = texture(u_state, v_uv + vec2( t.x,-t.y));
    float lu = tl.r*0.05 + tc.r*0.2 + tr.r*0.05
             + ml.r*0.2  - cu        + mr.r*0.2
             + bl.r*0.05 + bc.r*0.2  + br.r*0.05;
    float lv = tl.g*0.05 + tc.g*0.2 + tr.g*0.05
             + ml.g*0.2  - cv        + mr.g*0.2
             + bl.g*0.05 + bc.g*0.2  + br.g*0.05;
    float uuv = cu * cu * cv;
    float du = u_du * lu + u_a - (u_b + 1.0) * cu + uuv;
    float dv = u_dv * lv + u_b * cu - uuv;
    cu += du * u_dt;
    cv += dv * u_dt;
    vec2 px = v_uv / t;
    float d = length(px - u_brush);
    if (u_brush.x >= 0.0 && d < u_brushR) {
        float s = smoothstep(u_brushR, 0.0, d) * 0.5;
        if (u_brushChem < 0.5) cu += s * u_a;
        else cv += s * (u_b / max(u_a, 0.01));
    }
    fc = vec4(clamp(cu,0.0,25.0), clamp(cv,0.0,25.0), 0.0, 1.0);
}`,

// ---- Schnakenberg reaction-diffusion ----
schnakenberg: `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform vec2 u_texel;
uniform float u_a, u_b, u_du, u_dv, u_dt;
uniform vec2 u_brush;
uniform float u_brushR, u_brushChem;
in vec2 v_uv;
out vec4 fc;
void main() {
    vec2 t = u_texel;
    float cu = texture(u_state, v_uv).r;
    float cv = texture(u_state, v_uv).g;
    vec4 tl = texture(u_state, v_uv + vec2(-t.x, t.y));
    vec4 tc = texture(u_state, v_uv + vec2(  0., t.y));
    vec4 tr = texture(u_state, v_uv + vec2( t.x, t.y));
    vec4 ml = texture(u_state, v_uv + vec2(-t.x,  0.));
    vec4 mr = texture(u_state, v_uv + vec2( t.x,  0.));
    vec4 bl = texture(u_state, v_uv + vec2(-t.x,-t.y));
    vec4 bc = texture(u_state, v_uv + vec2(  0.,-t.y));
    vec4 br = texture(u_state, v_uv + vec2( t.x,-t.y));
    float lu = tl.r*0.05 + tc.r*0.2 + tr.r*0.05
             + ml.r*0.2  - cu        + mr.r*0.2
             + bl.r*0.05 + bc.r*0.2  + br.r*0.05;
    float lv = tl.g*0.05 + tc.g*0.2 + tr.g*0.05
             + ml.g*0.2  - cv        + mr.g*0.2
             + bl.g*0.05 + bc.g*0.2  + br.g*0.05;
    float uuv = cu * cu * cv;
    float du = u_du * lu + u_a - cu + uuv;
    float dv = u_dv * lv + u_b - uuv;
    cu += du * u_dt;
    cv += dv * u_dt;
    vec2 px = v_uv / t;
    float d = length(px - u_brush);
    if (u_brush.x >= 0.0 && d < u_brushR) {
        float s = smoothstep(u_brushR, 0.0, d) * 0.5;
        float ss = u_a + u_b;
        if (u_brushChem < 0.5) cu += s * ss;
        else cv += s * u_b / max(ss * ss, 0.01);
    }
    fc = vec4(max(cu,0.0), max(cv,0.0), 0.0, 1.0);
}`,

// ---- Display / color-mapping shader ----
// u_steady > 0 = deviation-from-steady-state mode (Brusselator/Schnakenberg)
// u_steady = 0 = raw concentration mode (Gray-Scott)
display: `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform sampler2D u_lut;
uniform float u_min, u_max, u_steady;
in vec2 v_uv;
out vec4 fc;
void main() {
    float raw = texture(u_state, v_uv).g;
    float val;
    if (u_steady > 0.001) {
        val = clamp(abs(raw - u_steady) / u_max, 0.0, 1.0);
    } else {
        val = clamp((raw - u_min) / (u_max - u_min), 0.0, 1.0);
    }
    fc = texture(u_lut, vec2(val, 0.5));
}`

};
