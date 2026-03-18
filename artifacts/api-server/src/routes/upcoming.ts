import { Router, type IRouter } from "express";
import { db, medicationRecordsTable, animalsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/upcoming", requireAuth, async (req, res): Promise<void> => {
  const ranchId = req.user!.ranchId;
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const in14Days = new Date(today);
  in14Days.setDate(in14Days.getDate() + 14);
  const in14DaysStr = in14Days.toISOString().split("T")[0];

  const in60Days = new Date(today);
  in60Days.setDate(in60Days.getDate() + 60);
  const in60DaysStr = in60Days.toISOString().split("T")[0];

  const animals = await db
    .select()
    .from(animalsTable)
    .where(eq(animalsTable.ranchId, ranchId));

  const medications = await db
    .select()
    .from(medicationRecordsTable)
    .where(eq(medicationRecordsTable.ranchId, ranchId));

  const upcomingMeds = medications
    .filter(m => m.nextDueDate && m.nextDueDate <= in14DaysStr)
    .map(m => {
      const animal = animals.find(a => a.id === m.animalId);
      return {
        id: m.id,
        animalId: m.animalId,
        animalName: animal?.name ?? "Unknown",
        medicationName: m.medicationName,
        nextDueDate: m.nextDueDate!,
        isOverdue: m.nextDueDate! < todayStr,
      };
    })
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));

  const upcomingPregnancies = animals
    .filter(a => a.sex === "Female" && a.expectedDueDate && a.expectedDueDate >= todayStr && a.expectedDueDate <= in60DaysStr)
    .map(a => ({
      animalId: a.id,
      animalName: a.name,
      species: a.species,
      expectedDueDate: a.expectedDueDate!,
    }))
    .sort((a, b) => a.expectedDueDate.localeCompare(b.expectedDueDate));

  const in30Days = new Date(today);
  in30Days.setDate(in30Days.getDate() + 30);
  const in30DaysStr = in30Days.toISOString().split("T")[0];

  const overdueMedsCount = medications.filter(m => m.nextDueDate && m.nextDueDate < todayStr).length;

  const dueSoonCount = animals.filter(a =>
    a.sex === "Female" &&
    a.expectedDueDate &&
    a.expectedDueDate >= todayStr &&
    a.expectedDueDate <= in30DaysStr
  ).length;

  res.json({
    medications: upcomingMeds,
    pregnancies: upcomingPregnancies,
    overdueMedsCount,
    dueSoonCount,
  });
});

export default router;
