"""
Email Indexer
Handles background indexing and decision detection
Follows engineering rules: async, lightweight classifier, no heavy models in sync path
"""
import asyncio
import re
from typing import Dict, Any, List
from datetime import datetime

class EmailIndexer:
    def __init__(self, db):
        self.db = db
        
        # Decision keywords (lightweight heuristics)
        self.decision_keywords = [
            'approve', 'approved', 'approval',
            'agreed', 'agree', 'agreement',
            'confirmed', 'confirm', 'confirmation',
            'will do', 'sounds good', 'let\'s do it',
            'signed', 'accepted', 'yes let\'s',
            'go ahead', 'greenlight', 'committed',
            'pricing', 'quote accepted', 'deal',
            'contract signed', 'purchase order'
        ]
        
        # High-value patterns
        self.decision_patterns = [
            r'(?i)approve[sd]?\s+(?:the\s+)?(?:proposal|budget|plan)',
            r'(?i)agreed?\s+(?:to|on)\s+\$[\d,]+',
            r'(?i)signed\s+(?:the\s+)?(?:contract|agreement|deal)',
            r'(?i)(?:purchase|sales)\s+order\s+#?\d+',
            r'(?i)confirmed?\s+(?:booking|reservation|appointment)',
        ]
    
    async def initialize(self):
        """Initialize indexer"""
        print("Email indexer initialized")
    
    async def detect_decisions(self, batch_size: int = 1000):
        """
        Run decision detection on unprocessed emails
        This runs asynchronously, never blocks search
        """
        print("Running decision detection...")
        
        # Get emails that haven't been classified
        cursor = await self.db.conn.execute("""
            SELECT id, subject, body_clean FROM emails
            WHERE decision_confidence = 0.0
            LIMIT ?
        """, (batch_size,))
        
        emails = await cursor.fetchall()
        
        for email in emails:
            email_dict = dict(email)
            is_decision, confidence = self._classify_decision(email_dict)
            
            # Update database
            await self.db.conn.execute("""
                UPDATE emails
                SET is_decision = ?, decision_confidence = ?
                WHERE id = ?
            """, (is_decision, confidence, email_dict['id']))
        
        await self.db.conn.commit()
        
        print(f"Classified {len(emails)} emails for decisions")
    
    def _classify_decision(self, email: Dict[str, Any]) -> tuple[bool, float]:
        """
        Lightweight decision classifier
        Uses keyword heuristics and patterns
        Returns (is_decision, confidence_score)
        """
        subject = (email.get('subject') or '').lower()
        body = (email.get('body_clean') or '').lower()
        text = f"{subject} {body}"
        
        confidence = 0.0
        
        # Check for decision keywords
        keyword_matches = 0
        for keyword in self.decision_keywords:
            if keyword in text:
                keyword_matches += 1
        
        if keyword_matches > 0:
            confidence += min(0.3 * keyword_matches, 0.6)
        
        # Check for decision patterns
        pattern_matches = 0
        for pattern in self.decision_patterns:
            if re.search(pattern, text):
                pattern_matches += 1
        
        if pattern_matches > 0:
            confidence += min(0.2 * pattern_matches, 0.4)
        
        # Boost confidence if multiple signals
        if keyword_matches > 0 and pattern_matches > 0:
            confidence += 0.2
        
        # Cap at 1.0
        confidence = min(confidence, 1.0)
        
        # Threshold: 0.4 or higher is considered a decision
        is_decision = confidence >= 0.4
        
        return is_decision, confidence
    
    async def reindex_all_for_decisions(self):
        """
        Reindex all emails for decision detection
        Run this if decision logic changes
        """
        # Reset all decision flags
        await self.db.conn.execute("""
            UPDATE emails
            SET decision_confidence = 0.0, is_decision = 0
        """)
        await self.db.conn.commit()
        
        # Run detection in batches
        total_emails = (await self.db.conn.execute("SELECT COUNT(*) FROM emails")).fetchone()[0]
        batch_size = 1000
        
        for offset in range(0, total_emails, batch_size):
            await self.detect_decisions(batch_size)
            print(f"Progress: {min(offset + batch_size, total_emails)}/{total_emails}")