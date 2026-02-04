// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../src/ActivityValidator.sol";

contract ActivityValidatorTest is Test {
    ActivityValidator public validator;
    address public validator1;
    address public validator2;
    
    event ActivitySubmitted(bytes32 indexed activityId, string description);
    event ActivityValidated(bytes32 indexed activityId, bool isValid, bool isShariaShariaCompliant);
    
    function setUp() public {
        validator = new ActivityValidator();
        validator1 = address(this);
        validator2 = address(0x2);
    }
    
    function testSubmitActivity() public {
        bytes32 activityId = keccak256("activity1");
        string memory description = "Halal food trade";
        string memory activityType = "trade";
        uint256 capital = 5 ether;
        
        vm.expectEmit(true, false, false, true);
        emit ActivitySubmitted(activityId, description);
        validator.submitActivity(activityId, description, activityType, capital);
        
        ActivityValidator.EconomicActivity memory activity = validator.getActivity(activityId);
        assertEq(activity.activityId, activityId);
        assertEq(activity.description, description);
        assertEq(activity.activityType, activityType);
        assertEq(activity.capitalRequired, capital);
        assertFalse(activity.isValidated);
    }
    
    function testValidateActivity() public {
        bytes32 activityId = keccak256("activity1");
        validator.submitActivity(activityId, "Halal manufacturing", "manufacturing", 10 ether);
        
        vm.expectEmit(true, false, false, true);
        emit ActivityValidated(activityId, true, true);
        validator.validateActivity(
            activityId,
            true,
            true,
            true,
            true,
            "Compliant halal manufacturing"
        );
        
        ActivityValidator.ValidationRecord memory record = validator.getValidation(activityId);
        assertTrue(record.isValid);
        assertTrue(record.isShariaShariaCompliant);
        assertTrue(record.isAssetBacked);
        assertTrue(record.hasRealEconomicValue);
    }
    
    function testProhibitedActivities() public {
        assertFalse(validator.isShariaShariaCompliant("alcohol"));
        assertFalse(validator.isShariaShariaCompliant("gambling"));
        assertFalse(validator.isShariaShariaCompliant("interest-lending"));
        assertFalse(validator.isShariaShariaCompliant("speculation"));
        assertTrue(validator.isShariaShariaCompliant("trade"));
        assertTrue(validator.isShariaShariaCompliant("manufacturing"));
    }
    
    function testAuthorizeValidator() public {
        assertFalse(validator.authorizedValidators(validator2));
        
        validator.authorizeValidator(validator2);
        
        assertTrue(validator.authorizedValidators(validator2));
    }
    
    function testAddProhibitedActivity() public {
        string memory newProhibited = "payday-lending";
        
        assertTrue(validator.isShariaShariaCompliant(newProhibited));
        
        validator.addProhibitedActivity(newProhibited);
        
        assertFalse(validator.isShariaShariaCompliant(newProhibited));
    }
    
    function testMeetsShariaShariaCompliance() public {
        bytes32 activityId = keccak256("activity1");
        validator.submitActivity(activityId, "Halal services", "services", 5 ether);
        
        assertFalse(validator.meetsShariaShariaCompliance(activityId));
        
        validator.validateActivity(activityId, true, true, true, true, "Fully compliant");
        
        assertTrue(validator.meetsShariaShariaCompliance(activityId));
    }
    
    function testRejectNonCompliantActivity() public {
        bytes32 activityId = keccak256("activity1");
        validator.submitActivity(activityId, "Interest-based lending", "interest-lending", 5 ether);
        
        validator.validateActivity(activityId, false, false, false, false, "Non-Sharia-compliant");
        
        ActivityValidator.ValidationRecord memory record = validator.getValidation(activityId);
        assertFalse(record.isValid);
        assertFalse(record.isShariaShariaCompliant);
        assertFalse(validator.meetsShariaShariaCompliance(activityId));
    }
}
