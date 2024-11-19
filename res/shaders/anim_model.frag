#version 430 core

out vec4 FragColor;

struct Material {
    sampler2D diffuse;
    sampler2D normalMap;  // Normal map texture
    vec3 specular;    
    float shininess;
};

struct Light {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;

    float constant;
    float linear;
    float quadratic;
};

in VS_OUT{
    vec2 TexCoords;
    vec3 FragPos;
    vec3 TBN_FragPos;
    mat3 TBN;
} fs_in;

// SSBO storing light positions
layout(std430, binding = 3) buffer LightPositions {
    int numLights;      // Number of lights
    vec4 positions[10];  // Array of light positions
};
// SSBO storing light colors
layout(std430, binding = 4) buffer LightColors {
    vec4 colors[10];  // Array of lights colors
};

uniform vec3 viewPos;  // Camera position
uniform Material material;
uniform Light light;

// Gamma correction parameters
const float gamma = 2.2;

float gammaCorrection(float value) {
    return pow(value, 1.0 / gamma);
}

vec3 gammaCorrection(vec3 value) {
    return pow(value, vec3(1.0 / gamma));
}

// ACES Tone Mapping
vec3 toneMappingACES(vec3 color) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;

    // ACES tone mapping curve
    return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
}

void main() {
    vec3 totalAmbient = vec3(0.0);
    vec3 totalDiffuse = vec3(0.0);
    vec3 totalSpecular = vec3(0.0);

    // Define ratios for ambient, diffuse, and specular
    const float ambientRatio = 0.3;
    const float diffuseRatio = 0.6;
    const float specularRatio = 0.1;

    for (int i = 0; i < numLights; i++) {
        vec3 lightPos = positions[i].xyz;  // Access the light position from the SSBO

        // Split color into ambient, diffuse, and specular components
        vec3 lightColor = colors[i].rgb;
        vec3 ambientColor = lightColor * ambientRatio;
        vec3 diffuseColor = lightColor * diffuseRatio;
        vec3 specularColor = lightColor * specularRatio;

        // Calculate ambient lighting
        vec3 ambient = ambientColor * texture(material.diffuse, fs_in.TexCoords).rgb;

        // Normal mapping: get perturbed normal
        vec3 normal = texture(material.normalMap, fs_in.TexCoords).rgb;
        normal = normalize(normal * 2.0 - 1.0);  // Transform to range [-1, 1]
        vec3 perturbedNormal = normalize(fs_in.TBN * normal);  // Convert to world space

        // Calculate light direction for the current light position
        vec3 lightDir = normalize(lightPos - fs_in.FragPos);
        float diff = max(dot(perturbedNormal, lightDir), 0.0);
        vec3 diffuse = diffuseColor * diff * texture(material.diffuse, fs_in.TexCoords).rgb;

        // Specular lighting (Blinn-Phong)
        vec3 viewDir = normalize(viewPos - fs_in.FragPos);
        vec3 halfwayDir = normalize(lightDir + viewDir);  // Blinn-Phong halfway vector
        float spec = pow(max(dot(perturbedNormal, halfwayDir), 0.0), material.shininess);
        vec3 specular = specularColor * (spec * material.specular);

        // Calculate attenuation based on distance to light source
        float distance = length(lightPos - fs_in.FragPos);
        float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance));

        // Apply attenuation to each light's contribution
        ambient  *= attenuation;
        diffuse  *= attenuation;
        specular *= attenuation;

        // Accumulate each light’s isolated effect to the totals
        totalAmbient  += ambient;
        totalDiffuse  += diffuse;
        totalSpecular += specular;
    }

    // Combine all lighting components and apply gamma correction
    vec3 result = totalAmbient + totalDiffuse + totalSpecular;

    result = toneMappingACES(result);

    result = gammaCorrection(result);

    // Output the final color
    FragColor = vec4(result, 1.0);
}
