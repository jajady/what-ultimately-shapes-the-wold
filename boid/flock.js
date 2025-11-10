// ------------------- Boid 무리 관리 -------------------
class Flock {
  constructor() {
    this.boids = [];
  }

  addBoid(b) {
    this.boids.push(b);
  }

  run(foodManager) {
    for (const b of this.boids) {
      b.run(this.boids, foodManager);
    }
  }
}