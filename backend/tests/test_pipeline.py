"""
test_pipeline.py — Unit tests for morpho_pipeline.py
Run with: pytest backend/tests/ -v
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from morpho_pipeline import compute_morpho_score, MATERIAL_DB


class TestMorphoScore:
    def test_mycelium_returns_high_score(self):
        result = compute_morpho_score("mycelium", 0.05, 12)
        assert result.sustainability_score >= 90
        assert result.material_id == "mycelium"

    def test_cardboard_score_lower_than_mycelium(self):
        r_myc  = compute_morpho_score("mycelium",  0.05, 12)
        r_card = compute_morpho_score("cardboard", 0.05, 12)
        assert r_myc.sustainability_score > r_card.sustainability_score

    def test_void_fill_scales_with_volume(self):
        small = compute_morpho_score("kraft", 0.01, 6)
        large = compute_morpho_score("kraft", 0.10, 6)
        assert large.void_fill_eliminated_m3 > small.void_fill_eliminated_m3

    def test_unknown_material_raises(self):
        with pytest.raises(ValueError, match="Unknown material"):
            compute_morpho_score("unobtainium", 0.05, 6)

    def test_all_materials_in_db(self):
        for mat_id in MATERIAL_DB:
            result = compute_morpho_score(mat_id, 0.05, 6)
            assert 0 < result.sustainability_score <= 100

    def test_degradation_months_affects_score(self):
        r0  = compute_morpho_score("mycelium", 0.05, 0)
        r24 = compute_morpho_score("mycelium", 0.05, 24)
        assert r24.sustainability_score >= r0.sustainability_score
