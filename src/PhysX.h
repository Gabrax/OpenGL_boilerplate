#pragma once

#include "PxPhysicsAPI.h"
#include "Utilities.hpp"
#include "LoadShader.h"

using namespace physx;

namespace PhysX {

  void Init();
  void RenderActors(const Shader& shader, unsigned int vao);
  void Simulate(float deltatime);
  void raycastAndApplyForce(PxScene* scene, const glm::vec3& origin, const glm::vec3& direction, float rayLength);
  void DisableRaycast(PxShape* shape);
  void EnableRaycast(PxShape* shape);
  PxTriangleMesh* CreateTriangleMesh(PxU32 numVertices, const PxVec3* vertices, PxU32 numTriangles, const PxU32* indices);

  PxScene* getScene();
  PxPhysics* getPhysics();
  PxMaterial* getMaterial();
}
