from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db import models


class AnalyticsService:
    @staticmethod
    def calculate_chapter_metrics(db: Session, chapter_id: int) -> Dict[str, Any]:
        """
        Calculates accuracy, readiness index, and focus quadrant for a given chapter.
        """
        chapter = db.query(models.Chapter).filter(models.Chapter.id == chapter_id).first()
        if not chapter:
            return {
                "accuracy": 0.0,
                "readiness_index": 0.0,
                "quiz_count": 0,
                "priority_quadrant": "URGENT FOCUS",
                "reason": "Chapter not found."
            }

        # Fetch completed quizzes for this chapter
        quizzes = db.query(models.Quiz).filter(
            models.Quiz.chapter_id == chapter_id,
            models.Quiz.is_completed == True
        ).all()

        quiz_count = len(quizzes)
        if quiz_count > 0:
            total_score = sum(q.score for q in quizzes)
            total_possible = sum(q.total_marks for q in quizzes)
            accuracy = round((total_score / total_possible) * 100, 1) if total_possible > 0 else 0.0
        else:
            # If no quizzes taken yet
            accuracy = 40.0 if chapter.is_completed else 0.0

        # Readiness Index Calculation:
        # Accuracy contributes 65%, completion status contributes 25%, quiz repetition contributes 10%
        completion_bonus = 25.0 if chapter.is_completed else 0.0
        repetition_bonus = min(quiz_count * 5.0, 10.0)  # Max 10 pts for 2+ quizzes
        readiness_index = min(100.0, round((accuracy * 0.65) + completion_bonus + repetition_bonus, 1))

        # Quadrant Categorization
        # High weightage is >= 15% (or >= 15 marks out of 100)
        is_high_weightage = (chapter.weightage_percent >= 15.0) or (chapter.weightage_marks >= 15.0)
        is_high_accuracy = accuracy >= 70.0

        if is_high_weightage and not is_high_accuracy:
            priority_quadrant = "URGENT FOCUS"
            reason = f"High exam weightage ({chapter.weightage_percent}%), but quiz accuracy is only {accuracy}%. High risk of losing marks!"
        elif is_high_weightage and is_high_accuracy:
            priority_quadrant = "STRENGTH"
            reason = f"Excellent mastery ({accuracy}% accuracy) in a high-yield topic ({chapter.weightage_percent}% weightage). Keep sharp!"
        elif not is_high_weightage and not is_high_accuracy:
            priority_quadrant = "REVIEW LATER"
            reason = f"Lower weightage ({chapter.weightage_percent}%). Focus on high-yield chapters first before revising."
        else:
            priority_quadrant = "MAINTAIN"
            reason = f"Good grasp ({accuracy}% accuracy) on a low-weightage chapter ({chapter.weightage_percent}%)."

        # Save/update cache in ReadinessMetric model
        metric = db.query(models.ReadinessMetric).filter(models.ReadinessMetric.chapter_id == chapter_id).first()
        if not metric:
            metric = models.ReadinessMetric(
                chapter_id=chapter_id,
                accuracy_score=accuracy,
                quiz_count=quiz_count,
                readiness_index=readiness_index,
                priority_level=priority_quadrant
            )
            db.add(metric)
        else:
            metric.accuracy_score = accuracy
            metric.quiz_count = quiz_count
            metric.readiness_index = readiness_index
            metric.priority_level = priority_quadrant
        
        db.commit()

        return {
            "accuracy": accuracy,
            "readiness_index": readiness_index,
            "quiz_count": quiz_count,
            "priority_quadrant": priority_quadrant,
            "reason": reason
        }

    @staticmethod
    def get_subject_readiness_report(db: Session, subject_id: int) -> Dict[str, Any]:
        """
        Generates the full Strategic Exam Readiness Report across all chapters.
        """
        subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
        if not subject:
            return None

        chapters = db.query(models.Chapter).filter(models.Chapter.subject_id == subject_id).order_by(models.Chapter.order).all()
        
        all_topics = []
        urgent_topics = []
        weighted_readiness_sum = 0.0
        total_weightage = sum(ch.weightage_percent for ch in chapters) or 100.0

        for ch in chapters:
            metrics = AnalyticsService.calculate_chapter_metrics(db, ch.id)
            
            topic_data = {
                "chapter_id": ch.id,
                "chapter_name": ch.name,
                "weightage_percent": round(ch.weightage_percent, 1),
                "weightage_marks": round(ch.weightage_marks, 1),
                "accuracy_score": metrics["accuracy"],
                "readiness_index": metrics["readiness_index"],
                "quiz_attempts": metrics["quiz_count"],
                "is_completed": ch.is_completed,
                "priority_quadrant": metrics["priority_quadrant"],
                "reason": metrics["reason"]
            }
            all_topics.append(topic_data)

            if metrics["priority_quadrant"] == "URGENT FOCUS":
                urgent_topics.append(topic_data)

            # Weight contribution to total readiness
            fraction = (ch.weightage_percent / total_weightage)
            weighted_readiness_sum += fraction * metrics["readiness_index"]

        overall_readiness_index = round(weighted_readiness_sum, 1)

        # Tactical recommendation
        if len(urgent_topics) > 0:
            top_urgent = urgent_topics[0]["chapter_name"]
            recommendation = f"Immediate action required on '{top_urgent}' ({urgent_topics[0]['weightage_percent']}% weightage). Take a targeted 10-question practice quiz and review the Dual-AI Revision Sheet today."
        elif overall_readiness_index >= 80.0:
            recommendation = "Outstanding exam preparation! All high-yield topics are well secured. Take full-syllabus mock papers to lock in top grades."
        else:
            recommendation = "Steady progress. Continue completing chapters and maintaining quiz scores above 75%."

        return {
            "subject_id": subject.id,
            "subject_name": subject.name,
            "total_marks": subject.total_marks,
            "overall_readiness_index": overall_readiness_index,
            "completed_chapters_count": sum(1 for ch in chapters if ch.is_completed),
            "total_chapters_count": len(chapters),
            "urgent_topics": urgent_topics,
            "all_topics": all_topics,
            "recommendation": recommendation
        }


analytics_service = AnalyticsService()
