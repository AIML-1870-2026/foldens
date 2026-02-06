// ============================================================
// Turing Patterns Explorer — GLSL Shader Sources
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
    float la = texture(u_state, v_uv + vec2(t.x,0)).r
             + texture(u_state, v_uv - vec2(t.x,0)).r
             + texture(u_state, v_uv + vec2(0,t.y)).r
             + texture(u_state, v_uv - vec2(0,t.y)).r - 4.0*a;
    float lb = texture(u_state, v_uv + vec2(t.x,0)).g
             + texture(u_state, v_uv - vec2(t.x,0)).g
             + texture(u_state, v_uv + vec2(0,t.y)).g
             + texture(u_state, v_uv - vec2(0,t.y)).g - 4.0*b;
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
    float u = texture(u_state, v_uv).r;
    float v = texture(u_state, v_uv).g;
    float lu = texture(u_state, v_uv + vec2(t.x,0)).r
             + texture(u_state, v_uv - vec2(t.x,0)).r
             + texture(u_state, v_uv + vec2(0,t.y)).r
             + texture(u_state, v_uv - vec2(0,t.y)).r - 4.0*u;
    float lv = texture(u_state, v_uv + vec2(t.x,0)).g
             + texture(u_state, v_uv - vec2(t.x,0)).g
             + texture(u_state, v_uv + vec2(0,t.y)).g
             + texture(u_state, v_uv - vec2(0,t.y)).g - 4.0*v;
    float uuv = u * u * v;
    float du = u_du * lu + u_a - (u_b + 1.0) * u + uuv;
    float dv = u_dv * lv + u_b * u - uuv;
    u += du * u_dt;
    v += dv * u_dt;
    vec2 px = v_uv / t;
    float d = length(px - u_brush);
    if (u_brush.x >= 0.0 && d < u_brushR) {
        float s = smoothstep(u_brushR, 0.0, d) * 0.5;
        if (u_brushChem < 0.5) u += s * u_a;
        else v += s * (u_b / max(u_a, 0.01));
    }
    fc = vec4(max(u,0.0), max(v,0.0), 0.0, 1.0);
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
    float u = texture(u_state, v_uv).r;
    float v = texture(u_state, v_uv).g;
    float lu = texture(u_state, v_uv + vec2(t.x,0)).r
             + texture(u_state, v_uv - vec2(t.x,0)).r
             + texture(u_state, v_uv + vec2(0,t.y)).r
             + texture(u_state, v_uv - vec2(0,t.y)).r - 4.0*u;
    float lv = texture(u_state, v_uv + vec2(t.x,0)).g
             + texture(u_state, v_uv - vec2(t.x,0)).g
             + texture(u_state, v_uv + vec2(0,t.y)).g
             + texture(u_state, v_uv - vec2(0,t.y)).g - 4.0*v;
    float uuv = u * u * v;
    float du = u_du * lu + u_a - u + uuv;
    float dv = u_dv * lv + u_b - uuv;
    u += du * u_dt;
    v += dv * u_dt;
    vec2 px = v_uv / t;
    float d = length(px - u_brush);
    if (u_brush.x >= 0.0 && d < u_brushR) {
        float s = smoothstep(u_brushR, 0.0, d) * 0.5;
        float ss = u_a + u_b;
        if (u_brushChem < 0.5) u += s * ss;
        else v += s * u_b / max(ss * ss, 0.01);
    }
    fc = vec4(max(u,0.0), max(v,0.0), 0.0, 1.0);
}`,

// ---- Display / color-mapping shader ----
display: `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform sampler2D u_lut;
uniform float u_min, u_max;
in vec2 v_uv;
out vec4 fc;
void main() {
    float v = texture(u_state, v_uv).g;
    float t = clamp((v - u_min) / (u_max - u_min), 0.0, 1.0);
    fc = texture(u_lut, vec2(t, 0.5));
}`

};
