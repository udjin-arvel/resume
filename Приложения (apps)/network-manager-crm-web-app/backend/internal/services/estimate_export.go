package services

import (
	"bytes"
	"context"
	"fmt"

	"github.com/jung-kurt/gofpdf"
	"github.com/radar-crm/backend/internal/assets"
	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/repositories"
	"github.com/xuri/excelize/v2"
)

const pdfFontFamily = "DejaVu"

type EstimateExportService struct {
	estimates *repositories.EstimateRepository
}

func NewEstimateExportService(estimates *repositories.EstimateRepository) *EstimateExportService {
	return &EstimateExportService{estimates: estimates}
}

func newEstimatePDF() *gofpdf.Fpdf {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddUTF8FontFromBytes(pdfFontFamily, "", assets.DejaVuSansRegular)
	pdf.AddUTF8FontFromBytes(pdfFontFamily, "B", assets.DejaVuSansBold)
	return pdf
}

func buildEstimatePDF(estimate *models.Estimate, blocks []models.EstimateBlock) ([]byte, error) {
	pdf := newEstimatePDF()
	pdf.AddPage()
	pdf.SetFont(pdfFontFamily, "B", 16)
	pdf.Cell(0, 10, fmt.Sprintf("Смета: %s", estimate.Name))
	pdf.Ln(12)

	pdf.SetFont(pdfFontFamily, "", 11)
	pdf.Cell(0, 6, fmt.Sprintf("Компания: %s", estimate.CompanyName))
	pdf.Ln(6)
	pdf.Cell(0, 6, fmt.Sprintf("Контакт: %s | %s | %s", estimate.ContactPerson, estimate.Phone, estimate.Email))
	pdf.Ln(6)
	pdf.Cell(0, 6, fmt.Sprintf("Локация: %s, %s", estimate.City, estimate.Country))
	pdf.Ln(6)
	pdf.Cell(0, 6, fmt.Sprintf("Статус: %s", estimateStatusLabel(estimate.Status)))
	pdf.Ln(10)

	pdf.SetFont(pdfFontFamily, "B", 11)
	pdf.Cell(40, 8, "Тип")
	pdf.Cell(60, 8, "Название")
	pdf.Cell(30, 8, "Сумма")
	pdf.Ln(8)
	pdf.SetFont(pdfFontFamily, "", 10)

	for _, b := range blocks {
		pdf.Cell(40, 7, blockTypeLabel(b.BlockType))
		pdf.Cell(60, 7, b.Title)
		pdf.Cell(30, 7, b.Amount)
		pdf.Ln(7)
	}

	pdf.Ln(6)
	pdf.SetFont(pdfFontFamily, "B", 12)
	pdf.Cell(0, 8, fmt.Sprintf("Итого: %s", estimate.TotalAmount))

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func estimateStatusLabel(status string) string {
	switch status {
	case "draft":
		return "Черновик"
	case "sent":
		return "Отправлена"
	case "approved":
		return "Согласована"
	case "rejected":
		return "Отклонена"
	default:
		return status
	}
}

func blockTypeLabel(blockType string) string {
	switch blockType {
	case "service", "services":
		return "Услуги"
	case "resource", "resources":
		return "Ресурсы"
	case "expense", "expenses":
		return "Доп. расходы"
	case "misc":
		return "Прочее"
	default:
		return blockType
	}
}

func (s *EstimateExportService) ExportPDF(ctx context.Context, id string) ([]byte, string, error) {
	estimate, err := s.estimates.GetByID(ctx, id)
	if err != nil {
		return nil, "", err
	}
	blocks, err := s.estimates.GetBlocksByEstimateID(ctx, id)
	if err != nil {
		return nil, "", err
	}

	data, err := buildEstimatePDF(estimate, blocks)
	if err != nil {
		return nil, "", err
	}
	filename := fmt.Sprintf("estimate_%s.pdf", estimate.ID)
	return data, filename, nil
}

func (s *EstimateExportService) ExportExcel(ctx context.Context, id string) ([]byte, string, error) {
	estimate, err := s.estimates.GetByID(ctx, id)
	if err != nil {
		return nil, "", err
	}
	blocks, err := s.estimates.GetBlocksByEstimateID(ctx, id)
	if err != nil {
		return nil, "", err
	}

	f := excelize.NewFile()
	defer f.Close()

	sheet := "Estimate"
	f.SetSheetName("Sheet1", sheet)
	_ = f.SetCellValue(sheet, "A1", "Название")
	_ = f.SetCellValue(sheet, "B1", estimate.Name)
	_ = f.SetCellValue(sheet, "A2", "Компания")
	_ = f.SetCellValue(sheet, "B2", estimate.CompanyName)
	_ = f.SetCellValue(sheet, "A3", "Статус")
	_ = f.SetCellValue(sheet, "B3", estimateStatusLabel(estimate.Status))

	headers := []string{"Тип", "Название", "Кол-во", "Ед.", "Цена", "Роль", "Часы", "Ставка", "Сумма", "Комментарий"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 5)
		_ = f.SetCellValue(sheet, cell, h)
	}

	row := 6
	for _, b := range blocks {
		values := []any{
			blockTypeLabel(b.BlockType), b.Title, b.Quantity, b.Unit, b.UnitPrice,
			b.Role, b.Hours, b.Rate, b.Amount, b.Comment,
		}
		for i, v := range values {
			cell, _ := excelize.CoordinatesToCellName(i+1, row)
			_ = f.SetCellValue(sheet, cell, v)
		}
		row++
	}
	totalCell, _ := excelize.CoordinatesToCellName(1, row+1)
	_ = f.SetCellValue(sheet, totalCell, "Итого")
	amountCell, _ := excelize.CoordinatesToCellName(9, row+1)
	_ = f.SetCellValue(sheet, amountCell, estimate.TotalAmount)

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, "", err
	}
	filename := fmt.Sprintf("estimate_%s.xlsx", estimate.ID)
	return buf.Bytes(), filename, nil
}
