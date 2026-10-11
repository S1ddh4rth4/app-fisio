package com.fisitec.appfisio.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.fisitec.appfisio.entity.Treatment;
import com.fisitec.appfisio.entity.User;

@Repository
public interface TreatmentRepository extends JpaRepository<Treatment, String> {

    Optional<Treatment> findByName(String name);

    boolean existsByNameAndPhysiotherapist(String name, User physiotherapist);

    // Obtener únicamente los tratamientos del fisioterapeuta
    List<Treatment> findByPhysiotherapist(User physiotherapist);

    // Obtener tratamientos propios del fisioterapeuta más los tratamientos globales
    // base
    @Query("SELECT t FROM Treatment t WHERE t.physiotherapist = :physio OR t.physiotherapist IS NULL ORDER BY t.name ASC")
    List<Treatment> findAvailableForPhysiotherapist(@Param("physio") User physio);
}