const fs = require("fs");
const path = require("path");
const stringSimilarity = require("string-similarity");

/**
 * Recherche l'exercice le plus similaire dans la base de données.
 * La recherche se fait sur les champs exerciceFR et exerciceEN.
 *
 * @param {string} inputExercise Le nom de l'exercice fourni par l'utilisateur.
 * @returns {object|null} L'objet exercice correspondant ou null s'il n'y a pas de correspondance avec un score suffisant.
 */
function findSimilarExercise(inputExercise) {
  // Chemin du fichier JSON contenant les données des exercices.
  // Vous pouvez adapter ce chemin en fonction de votre projet.
  const filePath = path.join(__dirname, "../data/strengthlevel.json");

  // Lecture et parsing du fichier JSON
  let exercisesData;
  try {
    exercisesData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.error("Erreur lors de la lecture des données d'exercices:", error);
    return null;
  }

  let bestMatch = null;
  let bestScore = 0;

  // Parcours de chaque exercice dans les données
  exercisesData.forEach((exercise) => {
    // Liste des noms associés à l'exercice (français et anglais)
    const namesToCompare = [];
    if (exercise.exerciceFR) {
      namesToCompare.push(exercise.exerciceFR);
    }
    if (exercise.exerciceEN) {
      namesToCompare.push(exercise.exerciceEN);
    }

    namesToCompare.forEach((name) => {
      // Calcul du score de similarité (en ignorant la casse)
      const similarity = stringSimilarity.compareTwoStrings(
        inputExercise.toLowerCase(),
        name.toLowerCase(),
      );

      // On ne garde que si le score est le meilleur et supérieure (ou égal) à 0.7
      if (similarity >= 0.7 && similarity > bestScore) {
        bestScore = similarity;
        bestMatch = exercise;
      }
    });
  });

  return bestMatch;
}

module.exports = { findSimilarExercise };
